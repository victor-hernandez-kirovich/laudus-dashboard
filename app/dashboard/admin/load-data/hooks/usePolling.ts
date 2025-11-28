import { useState, useEffect } from 'react'
import { EndpointStatus } from './useLoadDataState'
import { LoadDataJobStatus } from '@/lib/types'

interface UsePollingProps {
  addLog: (message: string) => void
  setEndpoints: React.Dispatch<React.SetStateAction<EndpointStatus[]>>
  setLogs: React.Dispatch<React.SetStateAction<string[]>>
}

export function usePolling({ addLog, setEndpoints, setLogs }: UsePollingProps) {
  const [isPolling, setIsPolling] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [pollingTimer, setPollingTimer] = useState<NodeJS.Timeout | null>(null)

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (pollingTimer) {
        clearInterval(pollingTimer)
      }
    }
  }, [pollingTimer])

  const stopPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      setPollingTimer(null)
    }
    setIsPolling(false)
  }

  const startPollingForJob = async (
    jobId: string,
    date: string,
    enabledEndpointsList: EndpointStatus[]
  ) => {
    setIsPolling(true)
    setIsLoading(true)
    addLog('🔄 Iniciando monitoreo del proceso...')
    addLog('⏱️ Consultando estado cada 15 segundos...')

    let pollCount = 0
    const maxPolls = 40 // Máximo 10 minutos (40 * 15s)

    const timer = setInterval(async () => {
      pollCount++

      try {
        // Obtener el estado del job desde MongoDB
        const jobResponse = await fetch(`/api/admin/load-data-status?jobId=${jobId}`)

        if (!jobResponse.ok) {
          console.error('Error fetching job status')
          return
        }

        const jobData = await jobResponse.json()
        const job: LoadDataJobStatus = jobData.job

        if (!job) {
          addLog('❌ No se pudo obtener el estado del trabajo')
          stopPolling()
          setIsLoading(false)
          return
        }

        // Actualizar logs desde MongoDB
        if (job.logs && job.logs.length > 0) {
          setLogs(job.logs)
        }

        // Verificar cada endpoint en las APIs de datos
        const endpointChecks = await Promise.all(
          enabledEndpointsList.map(async (endpoint) => {
            const endpointMap: { [key: string]: string } = {
              '8Columns': '8columns'
            }
            const apiEndpoint = endpointMap[endpoint.name] || endpoint.name

            try {
              const response = await fetch(`/api/data/${apiEndpoint}?date=${date}`)
              if (response.ok) {
                const data = await response.json()
                return {
                  name: endpoint.name,
                  found: data.data && data.data.length > 0,
                  count: data.data?.length || 0
                }
              }
            } catch (error) {
              console.error(`Error checking ${endpoint.name}:`, error)
            }
            return { name: endpoint.name, found: false, count: 0 }
          })
        )

        // Verificar si todos los endpoints tienen datos
        const allFound = endpointChecks.every(check => check.found)
        const someFound = endpointChecks.some(check => check.found)

        // Actualizar estado de endpoints en MongoDB
        if (someFound) {
          const updatedResults = endpointChecks.map(check => ({
            endpoint: check.name,
            status: check.found ? 'success' : 'pending' as 'success' | 'pending',
            records: check.found ? check.count : undefined,
            detectedAt: check.found ? new Date().toISOString() : undefined
          }))

          // Actualizar en MongoDB
          await fetch('/api/admin/load-data-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jobId,
              results: updatedResults,
              status: allFound ? 'completed' : 'running'
            })
          })

          // Actualizar estado local
          setEndpoints(prev => prev.map(e => {
            const check = endpointChecks.find(c => c.name === e.name)
            if (check && check.found) {
              return {
                ...e,
                status: 'success' as const,
                records: check.count
              }
            }
            return e
          }))

          // Mostrar progreso
          const newlyFound = endpointChecks.filter(c => c.found)
          newlyFound.forEach(check => {
            const logMessage = `✅ ${check.name}: ${check.count} registros detectados`
            addLog(logMessage)
          })
        }

        if (allFound) {
          // ¡Todos completados!
          addLog('')
          addLog('✅ ¡Todos los datos detectados en la base de datos!')

          const totalRecords = endpointChecks.reduce((sum, check) => sum + check.count, 0)
          addLog(`📊 Total: ${totalRecords} registros guardados`)
          addLog('🎉 ¡Proceso completado exitosamente!')

          // Actualizar job a completado en MongoDB
          await fetch('/api/admin/load-data-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jobId,
              status: 'completed',
              completedAt: new Date().toISOString()
            })
          })

          stopPolling()
          setIsLoading(false)
          return
        }

        // Mostrar progreso cada 30 segundos
        if (pollCount % 2 === 0) {
          const elapsed = (pollCount * 15) / 60
          const foundCount = endpointChecks.filter(c => c.found).length
          const totalCount = endpointChecks.length
          addLog(`⏳ Esperando... (${elapsed.toFixed(1)} min - ${foundCount}/${totalCount} endpoints completados)`)
        }

        // Timeout después de 10 minutos
        if (pollCount >= maxPolls) {
          addLog('')
          addLog('⚠️ Tiempo de espera agotado (10 minutos)')
          addLog('💡 El proceso puede seguir ejecutándose en segundo plano')

          const foundCount = endpointChecks.filter(c => c.found).length
          if (foundCount > 0) {
            addLog(`✅ Se completaron ${foundCount} de ${endpointChecks.length} endpoints`)
          }

          // Actualizar job a timeout en MongoDB
          await fetch('/api/admin/load-data-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jobId,
              status: 'timeout',
              completedAt: new Date().toISOString()
            })
          })

          stopPolling()
          setIsLoading(false)
        }

      } catch (error) {
        console.error('Error during polling:', error)
      }
    }, 15000) // Cada 15 segundos

    setPollingTimer(timer)
  }

  const fetchJobStatusAndResume = async (
    jobId: string,
    endpoints: EndpointStatus[]
  ) => {
    try {
      const response = await fetch(`/api/admin/load-data-status?jobId=${jobId}`)
      if (!response.ok) {
        console.error('Job not found or error fetching:', jobId)
        addLog('❌ No se pudo recuperar el estado del proceso desde el servidor')
        return null
      }

      const data = await response.json()
      const job: LoadDataJobStatus = data.job

      if (!job) {
        addLog('❌ Proceso no encontrado en el servidor')
        return null
      }

      // Restaurar logs desde MongoDB
      if (job.logs && job.logs.length > 0) {
        setLogs(job.logs)
        addLog('✅ Estado recuperado desde el servidor')
      }

      // Restaurar estados de endpoints
      setEndpoints(prev => prev.map(e => {
        const jobResult = job.results.find(r => r.endpoint === e.name)
        if (jobResult) {
          return {
            ...e,
            status: jobResult.status === 'success' ? 'success' :
              jobResult.status === 'error' ? 'error' :
                'loading',
            records: jobResult.records,
            error: jobResult.error
          }
        }
        return e
      }))

      // Si el job no está completado, reanudar polling
      if (job.status === 'running' || job.status === 'pending') {
        addLog('🔄 Reanudando monitoreo del proceso...')
        const enabledEndpoints = endpoints.filter(e =>
          job.endpoints.includes(e.name)
        )
        startPollingForJob(jobId, job.date, enabledEndpoints)
      } else if (job.status === 'completed') {
        addLog('✅ Proceso completado anteriormente')
      } else if (job.status === 'failed' || job.status === 'timeout') {
        addLog(`⚠️ Proceso anterior ${job.status === 'failed' ? 'falló' : 'expiró'}`)
      }

      return job
    } catch (error) {
      console.error('Error fetching job status:', error)
      addLog('❌ Error al conectar con el servidor')
      return null
    }
  }

  return {
    isPolling,
    isLoading,
    setIsLoading,
    startPollingForJob,
    stopPolling,
    fetchJobStatusAndResume
  }
}

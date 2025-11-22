'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Calendar, Database, Download, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { LoadDataJobStatus } from '@/lib/types'

interface EndpointStatus {
  name: string
  label: string
  enabled: boolean
  status: 'pending' | 'loading' | 'success' | 'error'
  records?: number
  error?: string
}

interface PersistedState {
  selectedDate: string
  endpoints: EndpointStatus[]
  activeJobId?: string
  logs: string[]
  lastUpdated: string
}

const STORAGE_KEY = 'laudus-load-data-state'

// Función para cargar estado desde localStorage
const loadPersistedState = (): Partial<PersistedState> | null => {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const parsed: PersistedState = JSON.parse(stored)

    // Validar que no sea muy antiguo (más de 7 días)
    const lastUpdated = new Date(parsed.lastUpdated)
    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceUpdate > 7) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsed
  } catch (error) {
    console.error('Error loading persisted state:', error)
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

// Función para guardar estado en localStorage
const savePersistedState = (state: PersistedState) => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving persisted state:', error)
  }
}

export default function LoadDataPage() {
  const [isMounted, setIsMounted] = useState(false)

  // Valores por defecto (usados en el servidor)
  const getDefaultDate = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
  }

  const getDefaultEndpoints = (): EndpointStatus[] => [
    { name: 'totals', label: 'Balance Totals', enabled: true, status: 'pending' },
    { name: 'standard', label: 'Balance Standard', enabled: true, status: 'pending' },
    { name: '8Columns', label: 'Balance 8 Columns', enabled: true, status: 'pending' }
  ]

  const [selectedDate, setSelectedDate] = useState<string>(getDefaultDate())
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>(getDefaultEndpoints())
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [isPolling, setIsPolling] = useState(false)
  const [pollingTimer, setPollingTimer] = useState<NodeJS.Timeout | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [showClearModal, setShowClearModal] = useState(false)

  // Limpiar timer de polling al desmontar
  useEffect(() => {
    return () => {
      if (pollingTimer) {
        clearInterval(pollingTimer)
      }
    }
  }, [pollingTimer])

  // Cargar estado persistido solo en el cliente (después del montaje)
  useEffect(() => {
    setIsMounted(true)
    const persisted = loadPersistedState()

    if (persisted) {
      if (persisted.selectedDate) {
        setSelectedDate(persisted.selectedDate)
      }
      if (persisted.endpoints) {
        setEndpoints(persisted.endpoints)
      }
      // Restaurar logs desde localStorage
      if (persisted.logs && persisted.logs.length > 0) {
        setLogs(persisted.logs)
      }
      // Si hay un jobId activo, restaurar el polling
      if (persisted.activeJobId) {
        setActiveJobId(persisted.activeJobId)
        // Mostrar mensaje de carga mientras se recuperan logs desde MongoDB
        addLog('🔄 Recuperando estado del proceso desde el servidor...')
        // Intentar recuperar el job desde MongoDB
        fetchJobStatusAndResume(persisted.activeJobId)
      }
    }
  }, [])

  // Función para recuperar el estado del job desde MongoDB y reanudar polling
  const fetchJobStatusAndResume = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/load-data-status?jobId=${jobId}`)
      if (!response.ok) {
        console.error('Job not found or error fetching:', jobId)
        addLog('❌ No se pudo recuperar el estado del proceso desde el servidor')
        setActiveJobId(null)
        return
      }

      const data = await response.json()
      const job: LoadDataJobStatus = data.job

      if (!job) {
        addLog('❌ Proceso no encontrado en el servidor')
        setActiveJobId(null)
        return
      }

      // Restaurar logs desde MongoDB (reemplazar los logs locales con los del servidor)
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
        // NO limpiar activeJobId aquí - mantener para mostrar logs históricos
        // setActiveJobId(null)
      } else if (job.status === 'failed' || job.status === 'timeout') {
        addLog(`⚠️ Proceso anterior ${job.status === 'failed' ? 'falló' : 'expiró'}`)
        // NO limpiar activeJobId aquí - mantener para mostrar logs históricos
        // setActiveJobId(null)
      }

    } catch (error) {
      console.error('Error fetching job status:', error)
      addLog('❌ Error al conectar con el servidor')
      setActiveJobId(null)
    }
  }

  // Efecto para persistir estado cuando cambia (solo después de montar)
  useEffect(() => {
    if (!isMounted) return

    // Siempre guardar el estado completo incluyendo logs
    const state: PersistedState = {
      selectedDate,
      endpoints,
      activeJobId: activeJobId || undefined,
      logs,
      lastUpdated: new Date().toISOString()
    }
    savePersistedState(state)
  }, [selectedDate, endpoints, activeJobId, logs, isMounted, isLoading, isPolling])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('es-CL')
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const toggleEndpoint = (name: string) => {
    if (isLoading) return
    setEndpoints(prev =>
      prev.map(e => e.name === name ? { ...e, enabled: !e.enabled } : e)
    )
  }

  const resetStatuses = () => {
    setEndpoints(prev =>
      prev.map(e => ({ ...e, status: 'pending' as const, records: undefined, error: undefined }))
    )
  }

  const stopPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      setPollingTimer(null)
    }
    setIsPolling(false)
    setActiveJobId(null)
  }

  const startPollingForJob = async (jobId: string, date: string, enabledEndpointsList: EndpointStatus[]) => {
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
        if (job.logs && job.logs.length > logs.length) {
          setLogs(job.logs)
        }

        // Verificar cada endpoint en las APIs de datos
        const endpointChecks = await Promise.all(
          enabledEndpointsList.map(async (endpoint) => {
            const endpointMap: { [key: string]: string } = {
              'totals': 'totals',
              'standard': 'standard',
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
            if (!logs.some(log => log.includes(logMessage))) {
              addLog(logMessage)
            }
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

          // Detener polling pero mantener activeJobId para mostrar logs
          if (pollingTimer) {
            clearInterval(pollingTimer)
            setPollingTimer(null)
          }
          setIsPolling(false)
          setIsLoading(false)
          // NO limpiar activeJobId aquí - mantener para persistir logs
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

          // Detener polling pero mantener activeJobId para mostrar logs
          if (pollingTimer) {
            clearInterval(pollingTimer)
            setPollingTimer(null)
          }
          setIsPolling(false)
          setIsLoading(false)
          // NO limpiar activeJobId aquí - mantener para persistir logs
        }

      } catch (error) {
        console.error('Error during polling:', error)
      }
    }, 15000) // Cada 15 segundos

    setPollingTimer(timer)
  }

  const handleClearData = () => {
    // Detener polling si está activo
    if (pollingTimer) {
      clearInterval(pollingTimer)
      setPollingTimer(null)
    }
    setIsPolling(false)
    setActiveJobId(null)
    setIsLoading(false)

    // Limpiar localStorage
    localStorage.removeItem(STORAGE_KEY)

    // Resetear a valores por defecto
    setSelectedDate(getDefaultDate())
    setEndpoints(getDefaultEndpoints())
    setLogs(['🔄 Estado reiniciado a valores por defecto'])

    // Cerrar modal
    setShowClearModal(false)
  }

  const handleLoadData = async () => {
    // Validaciones
    const enabledEndpoints = endpoints.filter(e => e.enabled)
    if (enabledEndpoints.length === 0) {
      addLog('❌ Error: Debes seleccionar al menos un endpoint')
      return
    }

    // Validar fecha
    const targetDate = new Date(selectedDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (targetDate > today) {
      addLog('❌ Error: No se pueden cargar datos de fechas futuras')
      return
    }

    // Iniciar proceso - Limpiar logs y estado previo
    setIsLoading(true)
    setLogs([]) // Limpiar logs del proceso anterior
    resetStatuses()

    // Limpiar job anterior si existe
    setActiveJobId(null)

    addLog(`📅 Iniciando carga de datos para ${selectedDate}`)
    addLog(`📊 Endpoints seleccionados: ${enabledEndpoints.map(e => e.label).join(', ')}`)
    addLog('🔐 Autenticando con Laudus API...')

    try {
      const response = await fetch('/api/admin/load-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: selectedDate,
          endpoints: enabledEndpoints.map(e => e.name)
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar datos')
      }

      // Guardar el jobId
      const jobId = result.jobId
      setActiveJobId(jobId)

      // Guardar INMEDIATAMENTE en localStorage para persistir el jobId
      const initialState: PersistedState = {
        selectedDate,
        endpoints,
        activeJobId: jobId,
        logs: [
          `[${new Date().toLocaleTimeString('es-CL')}] 📅 Iniciando carga de datos para ${selectedDate}`,
          `[${new Date().toLocaleTimeString('es-CL')}] 📊 Endpoints seleccionados: ${enabledEndpoints.map(e => e.label).join(', ')}`
        ],
        lastUpdated: new Date().toISOString()
      }
      savePersistedState(initialState)
      // Verificar el modo de ejecución
      if (result.mode === 'github-actions') {
        // Modo GitHub Actions - Mostrar enlace y empezar polling
        addLog('✅ Workflow de GitHub Actions disparado exitosamente')
        addLog('')
        addLog('🔗 Enlace para ver progreso en tiempo real:')
        addLog(`   ${result.actionUrl}`)
        addLog(`   Busca el workflow: "${result.workflowName}"`)
        addLog('')
        addLog(result.details.note)
        addLog('')

        // Iniciar polling para detectar cuando termina
        startPollingForJob(jobId, selectedDate, enabledEndpoints)

      } else if (result.mode === 'local-execution-async') {
        // Modo local async - Ejecutando en segundo plano
        addLog('✅ Script Python iniciado en segundo plano')
        addLog('')
        addLog('ℹ️ El proceso está ejecutándose localmente en el servidor')
        addLog('⏱️ Este proceso puede tardar entre 15-25 minutos')
        addLog('')
        addLog(result.details.note)
        addLog('')

        // Iniciar polling para detectar cuando termina
        startPollingForJob(jobId, selectedDate, enabledEndpoints)

      } else if (result.mode === 'local-execution') {
        // Modo local - Mostrar resultados inmediatamente
        addLog('ℹ️ Ejecución local completada')

        // Actualizar estados basado en resultados
        setEndpoints(prev => prev.map(endpoint => {
          const result_item = result.results.find((r: any) => r.endpoint === endpoint.name)
          if (!result_item) return endpoint

          return {
            ...endpoint,
            status: result_item.success ? 'success' : 'error',
            records: result_item.records,
            error: result_item.error
          }
        }))

        // Logs de resultados
        result.results.forEach((r: any) => {
          if (r.success) {
            addLog(`✅ ${r.endpoint}: ${r.records} registros guardados`)
          } else {
            addLog(`❌ ${r.endpoint}: ${r.error}`)
          }
        })

        addLog('')
        addLog(result.message)

        if (result.success) {
          addLog('🎉 ¡Proceso completado exitosamente!')
        } else {
          addLog('⚠️ Proceso completado con errores')
        }

        setIsLoading(false)
      }

    } catch (error) {
      addLog(`❌ Error fatal: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      setEndpoints(prev =>
        prev.map(e => e.enabled ? { ...e, status: 'error' as const, error: 'Failed to load' } : e)
      )
      setIsLoading(false)
      stopPolling()
    }
  }

  const getStatusIcon = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className='h-5 w-5 text-gray-400' />
      case 'loading':
        return <Download className='h-5 w-5 text-blue-500 animate-pulse' />
      case 'success':
        return <CheckCircle className='h-5 w-5 text-green-500' />
      case 'error':
        return <XCircle className='h-5 w-5 text-red-500' />
    }
  }

  const getStatusText = (endpoint: EndpointStatus) => {
    switch (endpoint.status) {
      case 'pending':
        return 'Pendiente'
      case 'loading':
        return 'Cargando...'
      case 'success':
        return `✓ ${endpoint.records} registros`
      case 'error':
        return `✗ ${endpoint.error || 'Error'}`
    }
  }

  return (
    <div>
      <Header
        title='Cargar Datos de Laudus'
        subtitle='Importar datos históricos desde la API de Laudus ERP'
      />

      <div className='p-4 sm:p-6 lg:p-8 space-y-6'>
        {/* Configuración */}
        <Card title='Configuración de Carga'>
          <div className='space-y-6'>
            {/* Botón para limpiar datos guardados */}
            <div className='flex justify-end'>
              <button
                onClick={() => setShowClearModal(true)}
                disabled={isLoading}
                className='text-xs text-gray-600 hover:text-red-600 underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                title='Limpiar datos guardados y resetear configuración'
              >
                🔄 Limpiar datos guardados
              </button>
            </div>
            {/* Selector de Fecha */}
            <div>
              <label className='flex items-center gap-2 text-sm font-medium text-gray-700 mb-2'>
                <Calendar className='h-4 w-4 text-blue-600' />
                Fecha del Balance
              </label>
              <input
                type='date'
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={isLoading}
                max={new Date().toISOString().split('T')[0]}
                className='w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed'
              />
              <p className='mt-1 text-xs text-gray-500'>
                Selecciona la fecha para la cual deseas cargar los datos
              </p>
            </div>

            {/* Selector de Endpoints */}
            <div>
              <label className='flex items-center gap-2 text-sm font-medium text-gray-700 mb-3'>
                <Database className='h-4 w-4 text-blue-600' />
                Endpoints a Cargar
              </label>
              <div className='space-y-2'>
                {endpoints.map(endpoint => (
                  <div
                    key={endpoint.name}
                    className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                  >
                    <div className='flex items-center gap-3'>
                      <input
                        type='checkbox'
                        id={endpoint.name}
                        checked={endpoint.enabled}
                        onChange={() => toggleEndpoint(endpoint.name)}
                        disabled={isLoading}
                        className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed'
                      />
                      <label
                        htmlFor={endpoint.name}
                        className='text-sm font-medium text-gray-900 cursor-pointer'
                      >
                        {endpoint.label}
                      </label>
                    </div>
                    <div className='flex items-center gap-2'>
                      {getStatusIcon(endpoint.status)}
                      <span className='text-xs text-gray-600'>
                        {getStatusText(endpoint)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón de Acción */}
            <div className='pt-4 border-t'>
              <div className='flex items-center gap-4'>
                <button
                  onClick={handleLoadData}
                  disabled={isLoading || endpoints.every(e => !e.enabled)}
                  className='flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
                >
                  {isLoading ? (
                    <>
                      <Download className='h-5 w-5 animate-pulse' />
                      {isPolling ? 'Monitoreando GitHub Actions...' : 'Cargando datos...'}
                    </>
                  ) : (
                    <>
                      <Download className='h-5 w-5' />
                      Cargar Datos
                    </>
                  )}
                </button>

                {isPolling && (
                  <button
                    onClick={stopPolling}
                    className='px-4 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors text-sm'
                  >
                    Detener Monitoreo
                  </button>
                )}
              </div>

              {isPolling && (
                <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                  <div className='flex items-center gap-2 text-sm text-blue-700'>
                    <div className='h-2 w-2 bg-blue-500 rounded-full animate-pulse'></div>
                    <span>Monitoreando progreso del workflow en GitHub Actions...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Log del Proceso - Mostrar siempre que haya logs o proceso activo */}
        {isMounted && (logs.length > 0 || isLoading || isPolling || activeJobId) && (
          <Card title='Log del Proceso'>
            <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs sm:text-sm overflow-x-auto max-h-96 overflow-y-auto'>
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className='mb-1'>
                    {log}
                  </div>
                ))
              ) : (
                <div className='text-gray-400 flex items-center gap-2'>
                  <div className='h-2 w-2 bg-blue-500 rounded-full animate-pulse'></div>
                  <span>Iniciando proceso...</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Información */}
        <Card>
          <div className='space-y-4'>
            <div className='flex items-start gap-3 text-sm text-gray-600'>
              <AlertCircle className='h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5' />
              <div className='space-y-2'>
                <p>
                  <strong>Nota:</strong> Esta herramienta permite cargar datos históricos desde la API de Laudus ERP.
                </p>
                <ul className='list-disc list-inside space-y-1 ml-2'>
                  <li>Los datos se guardan en la misma estructura que la automatización diaria</li>
                  <li>Si ya existen datos para la fecha seleccionada, serán sobrescritos</li>
                  <li>El proceso se ejecuta en segundo plano (local o GitHub Actions)</li>
                  <li>El sistema monitorea automáticamente el progreso cada 15 segundos</li>
                  <li>Puedes navegar a otras secciones mientras se ejecuta el proceso</li>
                  <li>Solo se pueden cargar fechas pasadas o la fecha actual</li>
                </ul>
              </div>
            </div>

            {/* Indicador de estado guardado */}
            {isMounted && (() => {
              const persisted = loadPersistedState()
              if (persisted?.lastUpdated) {
                const lastUpdated = new Date(persisted.lastUpdated)
                const timeAgo = (() => {
                  const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
                  if (seconds < 60) return 'hace unos segundos'
                  const minutes = Math.floor(seconds / 60)
                  if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
                  const hours = Math.floor(minutes / 60)
                  if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`
                  const days = Math.floor(hours / 24)
                  return `hace ${days} día${days > 1 ? 's' : ''}`
                })()

                return (
                  <div className='pt-4 border-t border-gray-200'>
                    <div className='flex items-center gap-2 text-xs text-gray-500'>
                      <CheckCircle className='h-4 w-4 text-green-500' />
                      <span>Estado guardado automáticamente {timeAgo}</span>
                    </div>
                  </div>
                )
              }
              return null
            })()}
          </div>
        </Card>
      </div>

      {/* Modal de confirmación para limpiar datos */}
      {showClearModal && (
        <div className='fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4'>
            <div className='flex items-start gap-3'>
              <AlertCircle className='h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5' />
              <div className='flex-1'>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  ¿Estás seguro de que deseas limpiar todos los datos guardados?
                </h3>
                <p className='text-sm text-gray-600'>
                  Esto reiniciará la configuración a los valores por defecto.
                </p>
              </div>
            </div>

            <div className='flex justify-end gap-3 pt-4'>
              <button
                onClick={() => setShowClearModal(false)}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
              >
                Cancelar
              </button>
              <button
                onClick={handleClearData}
                className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors'
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


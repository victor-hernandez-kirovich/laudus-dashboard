'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Download } from 'lucide-react'
import { useLoadDataState } from './hooks/useLoadDataState'
import { usePolling } from './hooks/usePolling'
import { DateSelector, EndpointSelector } from './components/FormControls'
import { LogViewer, LoadingIndicator, StateIndicator } from './components/LogViewer'
import { ClearDataModal } from './components/ClearDataModal'
import { InfoCard } from './components/InfoCard'
import { validateDate, validateEndpoints } from './utils/validators'

export default function LoadDataPage() {
  const {
    isMounted,
    selectedDate,
    setSelectedDate,
    endpoints,
    setEndpoints,
    logs,
    setLogs,
    addLog,
    activeJobId,
    setActiveJobId,
    clearState,
    resetEndpointStatuses,
    toggleEndpoint,
    getPersistedState
  } = useLoadDataState()

  const {
    isPolling,
    isLoading,
    setIsLoading,
    startPollingForJob,
    stopPolling,
    fetchJobStatusAndResume
  } = usePolling({ addLog, setEndpoints, setLogs })

  const [showClearModal, setShowClearModal] = useState(false)

  // Recuperar job activo al montar
  useEffect(() => {
    const persisted = getPersistedState()
    if (persisted?.activeJobId) {
      addLog('🔄 Recuperando estado del proceso desde el servidor...')
      fetchJobStatusAndResume(persisted.activeJobId, endpoints)
    }
  }, [])

  const handleClearData = () => {
    stopPolling()
    setIsLoading(false)
    clearState()
    setShowClearModal(false)
  }

  const handleLoadData = async () => {
    // Validaciones
    const dateValidation = validateDate(selectedDate)
    if (!dateValidation.valid) {
      addLog(`❌ Error: ${dateValidation.error}`)
      return
    }

    const endpointValidation = validateEndpoints(endpoints)
    if (!endpointValidation.valid) {
      addLog(`❌ Error: ${endpointValidation.error}`)
      return
    }

    const enabledEndpoints = endpointValidation.enabledEndpoints!

    // Iniciar proceso
    setIsLoading(true)
    setLogs([])
    resetEndpointStatuses()
    setActiveJobId(null)

    addLog(`📅 Iniciando carga de datos para ${selectedDate}`)
    addLog(`📊 Endpoints seleccionados: ${enabledEndpoints.map(e => e.label).join(', ')}`)
    addLog('🔐 Autenticando con Laudus API...')

    try {
      const response = await fetch('/api/admin/load-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          endpoints: enabledEndpoints.map(e => e.name)
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar datos')
      }

      const jobId = result.jobId
      setActiveJobId(jobId)

      // Manejar según el modo de ejecución
      if (result.mode === 'github-actions') {
        addLog('✅ Workflow de GitHub Actions disparado exitosamente')
        addLog('')
        addLog('🔗 Enlace para ver progreso en tiempo real:')
        addLog(`   ${result.actionUrl}`)
        addLog(`   Busca el workflow: "${result.workflowName}"`)
        addLog('')
        addLog(result.details.note)
        addLog('')

        startPollingForJob(jobId, selectedDate, enabledEndpoints)

      } else if (result.mode === 'local-execution-async') {
        addLog('✅ Script Python iniciado en segundo plano')
        addLog('')
        addLog('ℹ️ El proceso está ejecutándose localmente en el servidor')
        addLog('⏱️ Este proceso puede tardar entre 15-25 minutos')
        addLog('')
        addLog(result.details.note)
        addLog('')

        startPollingForJob(jobId, selectedDate, enabledEndpoints)

      } else if (result.mode === 'local-execution') {
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

            <DateSelector
              selectedDate={selectedDate}
              onChange={setSelectedDate}
              isLoading={isLoading}
            />

            <EndpointSelector
              endpoints={endpoints}
              onToggle={toggleEndpoint}
              isLoading={isLoading}
            />

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

              <LoadingIndicator isPolling={isPolling} />
            </div>
          </div>
        </Card>

        {/* Log del Proceso */}
        {(logs.length > 0 || isLoading || isPolling || activeJobId) && (
          <Card title='Log del Proceso'>
            <LogViewer
              logs={logs}
              isLoading={isLoading}
              isPolling={isPolling}
              isMounted={isMounted}
              activeJobId={activeJobId}
            />
          </Card>
        )}

        {/* Información */}
        <Card>
          <InfoCard />
          <StateIndicator getPersistedState={getPersistedState} isMounted={isMounted} />
        </Card>
      </div>

      <ClearDataModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearData}
      />
    </div>
  )
}


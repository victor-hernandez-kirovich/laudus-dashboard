'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Calendar, Database, Download, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

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
      if (persisted.logs) {
        setLogs(persisted.logs)
      }
    }
  }, [])

  // Efecto para persistir estado cuando cambia (solo después de montar)
  useEffect(() => {
    if (!isMounted) return
    
    // No guardar si está en proceso de carga o polling
    // Solo guardar estados finales (success, error, pending sin carga activa)
    if (isLoading || isPolling) return
    
    const state: PersistedState = {
      selectedDate,
      endpoints,
      logs,
      lastUpdated: new Date().toISOString()
    }
    savePersistedState(state)
  }, [selectedDate, endpoints, logs, isMounted, isLoading, isPolling])

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
  }

  const startPolling = async (date: string, enabledEndpointsList: EndpointStatus[]) => {
    setIsPolling(true)
    addLog('🔄 Iniciando monitoreo del proceso...')
    addLog('⏱️ Consultando estado cada 15 segundos...')

    let pollCount = 0
    const maxPolls = 40 // Máximo 10 minutos (40 * 15s)
    const detectedEndpoints = new Set<string>() // Para evitar logs duplicados
    
    const timer = setInterval(async () => {
      pollCount++
      
      try {
        // Verificar cada endpoint habilitado
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
        
        if (someFound) {
          // Actualizar estado de endpoints que ya tienen datos
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
          
          // Mostrar progreso (evitar duplicados con Set)
          const foundEndpoints = endpointChecks.filter(c => c.found)
          foundEndpoints.forEach(check => {
            if (!detectedEndpoints.has(check.name)) {
              detectedEndpoints.add(check.name)
              addLog(`✅ ${check.name}: ${check.count} registros detectados`)
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
          
          stopPolling()
          setIsLoading(false)
        }
        
      } catch (error) {
        console.error('Error during polling:', error)
      }
    }, 15000) // Cada 15 segundos
    
    setPollingTimer(timer)
  }

  const clearPersistedData = () => {
    if (typeof window === 'undefined') return
    
    const confirmed = window.confirm(
      '¿Estás seguro de que deseas limpiar todos los datos guardados? Esto reiniciará la configuración a los valores por defecto.'
    )
    
    if (confirmed) {
      localStorage.removeItem(STORAGE_KEY)
      
      // Resetear a valores por defecto
      setSelectedDate(getDefaultDate())
      setEndpoints(getDefaultEndpoints())
      setLogs([])
      
      addLog('🔄 Estado reiniciado a valores por defecto')
    }
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

    // Iniciar proceso
    setIsLoading(true)
    setLogs([])
    resetStatuses()
    
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
        startPolling(selectedDate, enabledEndpoints)
        
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
        startPolling(selectedDate, enabledEndpoints)
        
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
                onClick={clearPersistedData}
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

        {/* Log del Proceso */}
        {logs.length > 0 && (
          <Card title='Log del Proceso'>
            <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs sm:text-sm overflow-x-auto max-h-96 overflow-y-auto'>
              {logs.map((log, index) => (
                <div key={index} className='mb-1'>
                  {log}
                </div>
              ))}
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
    </div>
  )
}


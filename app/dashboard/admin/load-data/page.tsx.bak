'use client'

import { useState } from 'react'
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

export default function LoadDataPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
  })

  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    { name: 'totals', label: 'Balance Totals', enabled: true, status: 'pending' },
    { name: 'standard', label: 'Balance Standard', enabled: true, status: 'pending' },
    { name: '8Columns', label: 'Balance 8 Columns', enabled: true, status: 'pending' }
  ])

  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

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

    } catch (error) {
      addLog(`❌ Error fatal: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      setEndpoints(prev => 
        prev.map(e => e.enabled ? { ...e, status: 'error' as const, error: 'Failed to load' } : e)
      )
    } finally {
      setIsLoading(false)
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
                className='w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed'
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
              <button
                onClick={handleLoadData}
                disabled={isLoading || endpoints.every(e => !e.enabled)}
                className='w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
              >
                {isLoading ? (
                  <>
                    <Download className='h-5 w-5 animate-pulse' />
                    Cargando datos...
                  </>
                ) : (
                  <>
                    <Download className='h-5 w-5' />
                    Cargar Datos
                  </>
                )}
              </button>
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
          <div className='flex items-start gap-3 text-sm text-gray-600'>
            <AlertCircle className='h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5' />
            <div className='space-y-2'>
              <p>
                <strong>Nota:</strong> Esta herramienta permite cargar datos históricos desde la API de Laudus ERP.
              </p>
              <ul className='list-disc list-inside space-y-1 ml-2'>
                <li>Los datos se guardan en la misma estructura que la automatización diaria</li>
                <li>Si ya existen datos para la fecha seleccionada, serán sobrescritos</li>
                <li>El proceso puede tardar varios minutos dependiendo del tamaño de los datos</li>
                <li>Solo se pueden cargar fechas pasadas o la fecha actual</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

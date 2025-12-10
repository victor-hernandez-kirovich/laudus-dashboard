'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Download, Calendar, Building2, CheckCircle, Clock, Loader2 } from 'lucide-react'

interface DataStatus {
  exists: boolean
  records: number
  lastUpdated: string | null
}

interface PersistedState {
  selectedYear: number
  selectedMonth: number
  logs: string[]
  activeJobId: string | null
  lastUpdated: string
}

const STORAGE_KEY = 'laudus-load-invoices-branch-state'

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
]

// Load state from localStorage
const loadPersistedState = (): PersistedState | null => {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const parsed: PersistedState = JSON.parse(stored)
    const lastUpdated = new Date(parsed.lastUpdated)
    const daysSince = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince > 7) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

// Save state to localStorage
const savePersistedState = (state: PersistedState) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving state:', error)
  }
}

export default function LoadInvoicesBranchPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const period = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`

  // Generate year options
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  // Load persisted state on mount
  useEffect(() => {
    setIsMounted(true)
    const persisted = loadPersistedState()
    if (persisted) {
      if (persisted.selectedYear) setSelectedYear(persisted.selectedYear)
      if (persisted.selectedMonth) setSelectedMonth(persisted.selectedMonth)
      if (persisted.logs && persisted.logs.length > 0) setLogs(persisted.logs)
      if (persisted.activeJobId) setActiveJobId(persisted.activeJobId)
    }
  }, [])

  // Persist state when it changes
  useEffect(() => {
    if (!isMounted) return
    savePersistedState({
      selectedYear,
      selectedMonth,
      logs,
      activeJobId,
      lastUpdated: new Date().toISOString()
    })
  }, [selectedYear, selectedMonth, logs, activeJobId, isMounted])

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString('es-CL')
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }, [])

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Check if data exists for selected period
  const checkDataStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/load-invoices-branch?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setDataStatus({
          exists: data.dataExists,
          records: data.records,
          lastUpdated: data.lastUpdated
        })
      }
    } catch (error) {
      console.error('Error checking data status:', error)
    }
  }, [period])

  useEffect(() => {
    checkDataStatus()
  }, [checkDataStatus])

  // Polling for job status
  const startPolling = useCallback((jobId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }

    let pollCount = 0
    const maxPolls = 60

    pollingRef.current = setInterval(async () => {
      pollCount++

      try {
        const dataResponse = await fetch(`/api/admin/load-invoices-branch?period=${period}`)
        if (dataResponse.ok) {
          const dataResult = await dataResponse.json()
          
          if (dataResult.dataExists && dataResult.records > 0) {
            addLog(`✅ Datos detectados: ${dataResult.records} sucursales`)
            addLog('🎉 ¡Proceso completado exitosamente!')
            setDataStatus({
              exists: true,
              records: dataResult.records,
              lastUpdated: dataResult.lastUpdated
            })
            setIsLoading(false)
            setActiveJobId(null)
            if (pollingRef.current) {
              clearInterval(pollingRef.current)
              pollingRef.current = null
            }
            return
          }
        }

        if (pollCount % 4 === 0) {
          addLog(`⏳ Esperando datos... (${pollCount * 5}s)`)
        }

        if (pollCount >= maxPolls) {
          addLog('⚠️ Tiempo de espera agotado. Verifica los datos manualmente.')
          setIsLoading(false)
          setActiveJobId(null)
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 5000)
  }, [addLog, period])

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  const handleLoadData = async () => {
    setIsLoading(true)
    setLogs([])
    setActiveJobId(null)

    addLog(`📅 Iniciando carga de facturas por sucursal`)
    addLog(`📊 Periodo: ${MONTHS[selectedMonth - 1].label} ${selectedYear}`)
    addLog('🔐 Conectando con Laudus API...')

    try {
      const response = await fetch('/api/admin/load-invoices-branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar datos')
      }

      setActiveJobId(result.jobId)
      addLog('✅ Script Python iniciado en segundo plano')
      addLog('')
      addLog('ℹ️ El proceso está ejecutándose localmente en el servidor')
      addLog('⏱️ Este proceso puede tardar entre 1-5 minutos')
      addLog('')

      startPolling(result.jobId)

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      setIsLoading(false)
    }
  }

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    setIsLoading(false)
    setActiveJobId(null)
    addLog('⏹️ Monitoreo detenido')
  }

  return (
    <div>
      <Header
        title='Cargar Facturas por Sucursal'
        subtitle='Importar datos de facturas agrupadas por sucursal desde Laudus'
      />

      <div className='p-4 sm:p-6 lg:p-8'>
        <div className='max-w-2xl mx-auto space-y-6'>
        <Card title='Configuración'>
          <div className='space-y-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='flex items-center gap-2 text-sm font-medium text-gray-700 mb-2'>
                  <Calendar className='h-4 w-4 text-blue-600' />
                  Año
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  disabled={isLoading}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed'
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className='flex items-center gap-2 text-sm font-medium text-gray-700 mb-2'>
                  <Building2 className='h-4 w-4 text-blue-600' />
                  Mes
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  disabled={isLoading}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed'
                >
                  {MONTHS.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {dataStatus && (
              <div className={`p-4 rounded-lg ${dataStatus.exists ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className='flex items-center gap-2'>
                  {dataStatus.exists ? (
                    <>
                      <CheckCircle className='h-5 w-5 text-green-600' />
                      <span className='text-green-800 font-medium'>
                        Datos existentes: {dataStatus.records} sucursales
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className='h-5 w-5 text-yellow-600' />
                      <span className='text-yellow-800 font-medium'>
                        No hay datos para este periodo
                      </span>
                    </>
                  )}
                </div>
                {dataStatus.lastUpdated && (
                  <p className='text-sm text-gray-600 mt-1'>
                    Última actualización: {new Date(dataStatus.lastUpdated).toLocaleString('es-CL')}
                  </p>
                )}
              </div>
            )}

            <div className='pt-4 border-t'>
              <div className='flex items-center gap-4'>
                <button
                  onClick={handleLoadData}
                  disabled={isLoading}
                  className='flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='h-5 w-5 animate-spin' />
                      Cargando datos...
                    </>
                  ) : (
                    <>
                      <Download className='h-5 w-5' />
                      {dataStatus?.exists ? 'Actualizar Datos' : 'Cargar Datos'}
                    </>
                  )}
                </button>

                {isLoading && (
                  <button
                    onClick={stopPolling}
                    className='px-4 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors text-sm'
                  >
                    Detener
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {(logs.length > 0 || activeJobId) && (
          <Card title='Log del Proceso'>
            <div className='bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto'>
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`py-1 ${
                    log.includes('❌') ? 'text-red-400' :
                    log.includes('✅') || log.includes('🎉') ? 'text-green-400' :
                    log.includes('⚠️') ? 'text-yellow-400' :
                    'text-gray-300'
                  }`}
                >
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </Card>
        )}

        <Card>
          <div className='text-sm text-gray-600 space-y-2'>
            <h4 className='font-medium text-gray-900'>Información</h4>
            <ul className='list-disc list-inside space-y-1'>
              <li>Este proceso extrae las facturas agrupadas por sucursal desde Laudus</li>
              <li>Los datos incluyen: sucursal, neto, porcentaje neto, margen, porcentaje margen, descuentos</li>
              <li>El proceso puede tardar entre 1-5 minutos dependiendo del volumen de datos</li>
              <li>Si ya existen datos para el periodo, serán reemplazados</li>
            </ul>
          </div>
        </Card>
        </div>
      </div>
    </div>
  )
}

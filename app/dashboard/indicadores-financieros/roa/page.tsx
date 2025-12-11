'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { RoaChart } from '@/components/charts/RoaChart'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface RoaData {
  date: string
  roa: number
  utilidadNeta: number
  activoTotal: number
  ingresos: number
  gastos: number
}

export default function RoaPage() {
  const [roaData, setRoaData] = useState<RoaData[]>([])
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredData, setHoveredData] = useState<RoaData | null>(null)

  // Cargar años disponibles al inicio
  useEffect(() => {
    async function fetchAvailableYears() {
      try {
        const res = await fetch('/api/data/balance-general')
        if (!res.ok) throw new Error('Error al cargar años disponibles')
        const result = await res.json()
        
        if (result.availableYears && result.availableYears.length > 0) {
          setAvailableYears(result.availableYears)
          setSelectedYear(result.availableYears[0])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setLoading(false)
      }
    }
    fetchAvailableYears()
  }, [])

  // Cargar datos del EERR y Balance General cuando cambie el año seleccionado
  useEffect(() => {
    if (!selectedYear) return

    async function fetchData() {
      setLoading(true)
      try {
        // Obtener datos del EERR y Balance General en paralelo
        const [eerrRes, balanceRes] = await Promise.all([
          fetch(`/api/data/eerr?year=${selectedYear}`),
          fetch(`/api/data/balance-general?year=${selectedYear}`)
        ])
        
        if (!eerrRes.ok) throw new Error('Error al cargar datos del Estado de Resultados')
        if (!balanceRes.ok) throw new Error('Error al cargar datos del Balance General')
        
        const eerrResult = await eerrRes.json()
        const balanceResult = await balanceRes.json()
        
        if (eerrResult.success && eerrResult.data && balanceResult.success && balanceResult.data) {
          const monthsAvailable = eerrResult.monthsAvailable || []
          const eerrData = eerrResult.data
          const balanceData = balanceResult.data.months || {}
          
          // Calcular ROA para cada mes
          const calculatedRoaData: RoaData[] = monthsAvailable.map((month: string) => {
            const monthEerr = eerrData[month]
            const monthBalance = balanceData[month]
            
            if (!monthEerr || !monthEerr.summary || !monthBalance || !monthBalance.totals) {
              return {
                date: `${selectedYear}-${month}-01`,
                roa: 0,
                utilidadNeta: 0,
                activoTotal: 0,
                ingresos: 0,
                gastos: 0
              }
            }
            
            const summary = monthEerr.summary
            const totals = monthBalance.totals
            
            // Datos del Estado de Resultados
            const ingresos = summary.ingresosOperacionales || 0
            const utilidadNeta = summary.utilidadPerdida || 0
            
            // Calcular gastos totales
            const costoVentas = summary.costoVentas || 0
            const gastosAdmin = summary.gastosAdmin || 0
            const depreciacion = summary.depreciacion || 0
            const gastosNoOperacionales = summary.gastosNoOperacionales || 0
            const correccionMonetaria = summary.correccionMonetaria || 0
            const impuestoRenta = summary.impuestoRenta || 0
            const gastosTotales = costoVentas + gastosAdmin + depreciacion + gastosNoOperacionales + correccionMonetaria + impuestoRenta
            
            // Datos del Balance General
            const activoTotal = totals.totalAssets || 0
            
            // Calcular ROA = (Utilidad Neta / Activo Total) * 100
            const roa = activoTotal > 0 ? (utilidadNeta / activoTotal) * 100 : 0
            
            return {
              date: `${selectedYear}-${month}-01`,
              roa: roa,
              utilidadNeta: utilidadNeta,
              activoTotal: activoTotal,
              ingresos: ingresos,
              gastos: gastosTotales
            }
          })
          
          setRoaData(calculatedRoaData)
        } else {
          setRoaData([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedYear])

  const formatSpanishDate = (dateString: string): string => {
    const [year, month] = dateString.split('-').map(Number)
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${months[month - 1]} ${year}`
  }

  const getRoaColor = (roa: number): string => {
    if (roa >= 5) return '#10b981' // Verde - Excelente
    if (roa >= 3) return '#3b82f6' // Azul - Bueno
    if (roa >= 1) return '#f59e0b' // Amarillo - Regular
    return '#ef4444' // Rojo - Bajo
  }

  const getRoaLabel = (roa: number): string => {
    if (roa >= 5) return 'Excelente'
    if (roa >= 3) return 'Bueno'
    if (roa >= 1) return 'Regular'
    return 'Bajo'
  }

  if (loading) {
    return (
      <div>
        <Header title='ROA - Return on Assets' subtitle='Retorno sobre Activos' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-600'>Cargando datos...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Header title='ROA - Return on Assets' subtitle='Retorno sobre Activos' />
        <div className='p-8'>
          <Card>
            <div className='text-red-600'>Error: {error}</div>
          </Card>
        </div>
      </div>
    )
  }

  if (availableYears.length === 0) {
    return (
      <div>
        <Header title='ROA - Return on Assets' subtitle='No hay datos disponibles' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-500'>No se encontraron datos</div>
        </div>
      </div>
    )
  }

  // El último mes disponible (más reciente) está al final del array
  const latestData = roaData.length > 0 ? roaData[roaData.length - 1] : null
  
  if (!latestData) {
    return (
      <div>
        <Header title='ROA - Return on Assets' subtitle='No hay datos disponibles' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-500'>No se encontraron datos para el año {selectedYear}</div>
        </div>
      </div>
    )
  }
  
  const displayData = hoveredData || latestData
  
  // Encontrar el mes anterior para comparación
  const displayIndex = roaData.findIndex(d => d.date === displayData.date)
  const previousData = displayIndex > 0 
    ? roaData[displayIndex - 1] 
    : null
  
  const cambioVsMesAnterior = previousData 
    ? displayData.roa - previousData.roa 
    : 0
  
  const tendencia = cambioVsMesAnterior > 0 ? 'up' : cambioVsMesAnterior < 0 ? 'down' : 'neutral'

  const roaColor = getRoaColor(displayData.roa)
  const roaLabel = getRoaLabel(displayData.roa)

  return (
    <div>
      <Header
        title='ROA - Return on Assets'
        subtitle='Indicador de eficiencia en el uso de activos (datos desde EERR y Balance General)'
      />

      <div className='p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8'>
        {/* Selector de Año */}
        <div className='flex justify-end'>
          <div className='flex items-center gap-2'>
            <label htmlFor='year-select' className='text-sm font-medium text-gray-700'>
              Año:
            </label>
            <select
              id='year-select'
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className='rounded-md border-2 border-gray-400 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Validación de datos filtrados */}
        {roaData.length === 0 ? (
          <div className='p-8 text-center text-gray-500'>
            No se encontraron datos para el año {selectedYear}
          </div>
        ) : (
          <>
        {/* Grid con Gauge y Gráfico */}
        <div className='grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6'>
          {/* Gauge ROA */}
          <Card 
            title={`ROA - ${formatSpanishDate(displayData.date)}`}
            key={displayData.date}
          >
            <div className='flex flex-col items-center justify-center py-4'>
              {/* Gauge circular */}
              <div className='relative w-48 h-48 mb-4'>
                <svg className='w-full h-full transform -rotate-90' viewBox='0 0 100 100'>
                  {/* Fondo del círculo */}
                  <circle
                    cx='50'
                    cy='50'
                    r='40'
                    fill='none'
                    stroke='#e5e7eb'
                    strokeWidth='8'
                  />
                  {/* Progreso del círculo - Proporcional al % real */}
                  <circle
                    cx='50'
                    cy='50'
                    r='40'
                    fill='none'
                    stroke={roaColor}
                    strokeWidth='8'
                    strokeDasharray={`${Math.min((displayData.roa / 100) * 251.2, 251.2)} 251.2`}
                    strokeLinecap='round'
                    className='transition-all duration-300'
                  />
                </svg>
                {/* Texto central */}
                <div className='absolute inset-0 flex flex-col items-center justify-center'>
                  <div className='text-3xl font-bold transition-colors duration-300' style={{ color: roaColor }}>
                    {displayData.roa.toFixed(2)}%
                  </div>
                  <div className='text-xs font-semibold mt-1 text-gray-600'>
                    ROA
                  </div>
                  <div className='text-sm font-semibold mt-0.5 transition-colors duration-300' style={{ color: roaColor }}>
                    {roaLabel}
                  </div>
                </div>
              </div>

              {/* Utilidad Neta */}
              <div className='text-center mb-3'>
                <div className='text-xs text-gray-600 mb-1'>Utilidad Neta</div>
                <div className='text-2xl font-bold text-green-600 transition-all duration-300'>
                  {formatCurrency(displayData.utilidadNeta)}
                </div>
              </div>

              {/* Activo Total */}
              <div className='text-center mb-3'>
                <div className='text-xs text-gray-600 mb-1'>Activo Total</div>
                <div className='text-xl font-semibold text-blue-600'>
                  {formatCurrency(displayData.activoTotal)}
                </div>
              </div>

              {/* Comparación con mes anterior */}
              {previousData && (
                <div className='flex flex-col items-center gap-2 mt-2'>
                  <div className='flex items-center gap-2'>
                    {tendencia === 'up' && (
                      <>
                        <TrendingUp className='h-5 w-5 text-green-600' />
                        <span className='text-green-600 font-semibold text-base'>
                          +{cambioVsMesAnterior.toFixed(2)}%
                        </span>
                      </>
                    )}
                    {tendencia === 'down' && (
                      <>
                        <TrendingDown className='h-5 w-5 text-red-600' />
                        <span className='text-red-600 font-semibold text-base'>
                          {cambioVsMesAnterior.toFixed(2)}%
                        </span>
                      </>
                    )}
                    {tendencia === 'neutral' && (
                      <>
                        <Minus className='h-5 w-5 text-gray-600' />
                        <span className='text-gray-600 font-semibold text-base'>
                          Sin cambio
                        </span>
                      </>
                    )}
                    <span className='text-xs text-gray-600'>vs mes anterior</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Gráfico de Evolución */}
          {roaData.length > 1 && (
            <RoaChart 
              data={roaData.slice(0, 12)} 
              onHover={setHoveredData}
            />
          )}
        </div>
          </>
        )}

        {/* Explicación del ROA */}
        <Card title='¿Qué es el ROA?'>
          <div className='text-sm text-gray-700 space-y-4'>
            <p>
              El <strong>ROA</strong> (Return on Assets - Retorno sobre Activos) es un indicador financiero 
              que mide la <strong>eficiencia</strong> con la que una empresa utiliza sus activos para generar utilidades.
            </p>
            
            <div className='bg-blue-50 border-l-4 border-blue-500 p-4 my-4'>
              <p className='font-semibold text-blue-900 mb-2'>Fórmula:</p>
              <div className='font-mono text-blue-800'>
                ROA = (Utilidad Neta / Activo Total) × 100
              </div>
            </div>

            <div className='bg-green-50 border-l-4 border-green-500 p-4 my-4'>
              <p className='font-semibold text-green-900 mb-2'>¿Por qué es importante?</p>
              <ul className='space-y-1 text-green-800 text-sm'>
                <li>• Indica qué tan productivos son los activos de la empresa</li>
                <li>• Permite comparar la eficiencia entre diferentes empresas</li>
                <li>• Ayuda a evaluar decisiones de inversión en activos</li>
                <li>• Muestra si los activos están generando suficiente retorno</li>
              </ul>
            </div>

            <div>
              <p className='font-semibold mb-2'>Rangos de Referencia:</p>
              <ul className='space-y-2 pl-4'>
                <li className='flex items-start gap-2'>
                  <span className='text-green-600 font-bold'>•</span>
                  <span>
                    <strong className='text-green-600'>≥ 5%:</strong> Excelente - Uso muy eficiente de activos
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-blue-600 font-bold'>•</span>
                  <span>
                    <strong className='text-blue-600'>3-5%:</strong> Bueno - Eficiencia saludable
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-orange-600 font-bold'>•</span>
                  <span>
                    <strong className='text-orange-600'>1-3%:</strong> Regular - Hay margen de mejora
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-red-600 font-bold'>•</span>
                  <span>
                    <strong className='text-red-600'>&lt; 1%:</strong> Bajo - Los activos no están generando suficiente retorno
                  </span>
                </li>
              </ul>
            </div>

            <div className='bg-gray-50 p-4 rounded-lg mt-4'>
              <p className='font-semibold mb-2'>Ejemplo con tus datos actuales:</p>
              <div className='font-mono text-xs space-y-1'>
                <p>Ingresos: {formatCurrency(latestData.ingresos)}</p>
                <p>(-) Gastos: {formatCurrency(latestData.gastos)}</p>
                <p className='border-t pt-1'>= Utilidad Neta: {formatCurrency(latestData.utilidadNeta)}</p>
                <p className='mt-2'>Activo Total: {formatCurrency(latestData.activoTotal)}</p>
                <p className='border-t pt-1 font-bold mt-2 text-blue-600'>
                  ROA = ({formatCurrency(latestData.utilidadNeta)} / {formatCurrency(latestData.activoTotal)}) × 100 = {latestData.roa.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className='bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4'>
              <p className='font-semibold text-yellow-900 mb-2'>💡 Tip:</p>
              <p className='text-yellow-800 text-sm'>
                Un ROA bajo puede indicar que tienes demasiados activos improductivos o que tus márgenes 
                de utilidad son bajos. Considera optimizar el uso de activos o mejorar la rentabilidad operativa.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

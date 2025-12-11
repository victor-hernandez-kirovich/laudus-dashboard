'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { RoiChart } from '@/components/charts/RoiChart'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface RoiData {
  date: string
  roi: number
  utilidadNeta: number
  patrimonio: number
  ingresos: number
  gastos: number
  activoTotal: number
  pasivoTotal: number
}

export default function RoiPage() {
  const [roiData, setRoiData] = useState<RoiData[]>([])
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredData, setHoveredData] = useState<RoiData | null>(null)

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
          
          // Calcular ROI para cada mes
          const calculatedRoiData: RoiData[] = monthsAvailable.map((month: string) => {
            const monthEerr = eerrData[month]
            const monthBalance = balanceData[month]
            
            if (!monthEerr || !monthEerr.summary || !monthBalance || !monthBalance.totals) {
              return {
                date: `${selectedYear}-${month}-01`,
                roi: 0,
                utilidadNeta: 0,
                patrimonio: 0,
                ingresos: 0,
                gastos: 0,
                activoTotal: 0,
                pasivoTotal: 0
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
            const pasivoTotal = totals.totalLiabilities || 0
            const patrimonio = totals.totalEquity || 0
            
            // Calcular ROI (ROE) = (Utilidad Neta / Patrimonio) * 100
            const roi = patrimonio > 0 ? (utilidadNeta / patrimonio) * 100 : 0
            
            return {
              date: `${selectedYear}-${month}-01`,
              roi: roi,
              utilidadNeta: utilidadNeta,
              patrimonio: patrimonio,
              ingresos: ingresos,
              gastos: gastosTotales,
              activoTotal: activoTotal,
              pasivoTotal: pasivoTotal
            }
          })
          
          setRoiData(calculatedRoiData)
        } else {
          setRoiData([])
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

  const getRoiColor = (roi: number): string => {
    if (roi >= 15) return '#10b981' // Verde - Excelente
    if (roi >= 10) return '#3b82f6' // Azul - Bueno
    if (roi >= 5) return '#f59e0b' // Amarillo - Regular
    return '#ef4444' // Rojo - Bajo
  }

  const getRoiLabel = (roi: number): string => {
    if (roi >= 15) return 'Excelente'
    if (roi >= 10) return 'Bueno'
    if (roi >= 5) return 'Regular'
    return 'Bajo'
  }

  if (loading) {
    return (
      <div>
        <Header title='ROI - Return on Investment' subtitle='Retorno sobre Inversión (ROE)' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-600'>Cargando datos...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Header title='ROI - Return on Investment' subtitle='Retorno sobre Inversión (ROE)' />
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
        <Header title='ROI - Return on Investment' subtitle='No hay datos disponibles' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-500'>No se encontraron datos</div>
        </div>
      </div>
    )
  }

  // Obtener el último mes disponible
  const latestData = roiData.length > 0 ? roiData[roiData.length - 1] : null
  const displayData = hoveredData || latestData
  
  // Encontrar el mes anterior para comparación
  const displayIndex = roiData.findIndex(d => d.date === displayData?.date)
  const previousData = displayIndex > 0 
    ? roiData[displayIndex - 1] 
    : null
  
  const cambioVsMesAnterior = previousData && displayData
    ? displayData.roi - previousData.roi 
    : 0
  
  const tendencia = cambioVsMesAnterior > 0 ? 'up' : cambioVsMesAnterior < 0 ? 'down' : 'neutral'

  const roiColor = displayData ? getRoiColor(displayData.roi) : '#ef4444'
  const roiLabel = displayData ? getRoiLabel(displayData.roi) : 'Sin datos'

  return (
    <div>
      <Header
        title='ROI - Return on Investment (ROE)'
        subtitle='Indicador de rendimiento sobre el patrimonio o capital invertido'
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

        {/* Validación de datos */}
        {roiData.length === 0 || !displayData ? (
          <div className='p-8 text-center text-gray-500'>
            No se encontraron datos para el año {selectedYear}
          </div>
        ) : (
          <>
        {/* Grid con Gauge y Gráfico */}
        <div className='grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6'>
          {/* Gauge ROI */}
          <Card 
            title={`ROI (ROE) - ${formatSpanishDate(displayData.date)}`}
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
                    stroke={roiColor}
                    strokeWidth='8'
                    strokeDasharray={`${Math.min((displayData.roi / 100) * 251.2, 251.2)} 251.2`}
                    strokeLinecap='round'
                    className='transition-all duration-300'
                  />
                </svg>
                {/* Texto central */}
                <div className='absolute inset-0 flex flex-col items-center justify-center'>
                  <div className='text-2xl font-bold transition-colors duration-300' style={{ color: roiColor }}>
                    {displayData.roi.toFixed(2)}%
                  </div>
                  <div className='text-xs font-semibold mt-1 text-gray-600'>
                    ROI (ROE)
                  </div>
                  <div className='text-md font-semibold mt-0.5 transition-colors duration-300' style={{ color: roiColor }}>
                    {roiLabel}
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

              {/* Patrimonio */}
              <div className='text-center mb-3'>
                <div className='text-xs text-gray-600 mb-1'>Patrimonio</div>
                <div className='text-xl font-semibold text-blue-600'>
                  {formatCurrency(displayData.patrimonio)}
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
          {roiData.length > 1 && (
            <RoiChart 
              data={roiData.slice(0, 12)} 
              onHover={setHoveredData}
            />
          )}
        </div>
          </>
        )}

        {/* Explicación del ROI */}
        <Card title='¿Qué es el ROI (ROE)?'>
          <div className='text-sm text-gray-700 space-y-4'>
            <p>
              El <strong>ROI</strong> (Return on Investment - Retorno sobre Inversión), también conocido como 
              <strong> ROE</strong> (Return on Equity - Retorno sobre Patrimonio), mide el <strong>rendimiento</strong> que 
              genera la empresa sobre el capital invertido por los accionistas o propietarios.
            </p>
            
            <div className='bg-green-50 border-l-4 border-green-500 p-4 my-4'>
              <p className='font-semibold text-green-900 mb-2'>Fórmula:</p>
              <div className='font-mono text-green-800'>
                ROI (ROE) = (Utilidad Neta / Patrimonio) × 100
              </div>
              <p className='text-xs text-green-700 mt-2'>
                Donde: Patrimonio = Activo Total - Pasivo Total
              </p>
            </div>

            <div className='bg-blue-50 border-l-4 border-blue-500 p-4 my-4'>
              <p className='font-semibold text-blue-900 mb-2'>¿Por qué es importante?</p>
              <ul className='space-y-1 text-blue-800 text-sm'>
                <li>• Indica el retorno que obtienen los inversionistas/accionistas</li>
                <li>• Ayuda a evaluar si la inversión en la empresa es rentable</li>
                <li>• Permite comparar con otras alternativas de inversión</li>
                <li>• Muestra la capacidad de generar valor para los propietarios</li>
              </ul>
            </div>

            <div>
              <p className='font-semibold mb-2'>Rangos de Referencia:</p>
              <ul className='space-y-2 pl-4'>
                <li className='flex items-start gap-2'>
                  <span className='text-green-600 font-bold'>•</span>
                  <span>
                    <strong className='text-green-600'>≥ 15%:</strong> Excelente - Retorno muy atractivo para inversionistas
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-blue-600 font-bold'>•</span>
                  <span>
                    <strong className='text-blue-600'>10-15%:</strong> Bueno - Retorno saludable y competitivo
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-orange-600 font-bold'>•</span>
                  <span>
                    <strong className='text-orange-600'>5-10%:</strong> Regular - Retorno aceptable pero mejorable
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-red-600 font-bold'>•</span>
                  <span>
                    <strong className='text-red-600'>&lt; 5%:</strong> Bajo - El capital no está generando suficiente rendimiento
                  </span>
                </li>
              </ul>
            </div>

            {displayData && (
            <div className='bg-gray-50 p-4 rounded-lg mt-4'>
              <p className='font-semibold mb-2'>Ejemplo con tus datos actuales:</p>
              <div className='font-mono text-xs space-y-1'>
                <p>Activo Total: {formatCurrency(displayData.activoTotal)}</p>
                <p>(-) Pasivo Total: {formatCurrency(displayData.pasivoTotal)}</p>
                <p className='border-t pt-1'>= Patrimonio: {formatCurrency(displayData.patrimonio)}</p>
                <p className='mt-3'>Ingresos: {formatCurrency(displayData.ingresos)}</p>
                <p>(-) Gastos: {formatCurrency(displayData.gastos)}</p>
                <p className='border-t pt-1'>= Utilidad Neta: {formatCurrency(displayData.utilidadNeta)}</p>
                <p className='border-t pt-1 font-bold mt-2 text-green-600'>
                  ROI = ({formatCurrency(displayData.utilidadNeta)} / {formatCurrency(displayData.patrimonio)}) × 100 = {displayData.roi.toFixed(2)}%
                </p>
              </div>
            </div>
            )}

            <div className='bg-purple-50 border-l-4 border-purple-500 p-4 mt-4'>
              <p className='font-semibold text-purple-900 mb-2'>💡 Diferencia entre ROA y ROI (ROE):</p>
              <div className='text-purple-800 text-sm space-y-2'>
                <p><strong>• ROA:</strong> Mide la eficiencia de TODOS los activos (independiente de cómo se financien)</p>
                <p><strong>• ROI (ROE):</strong> Mide el retorno específico sobre el capital de los propietarios</p>
                <p className='mt-2 pt-2 border-t border-purple-300'>
                  Un ROI alto puede indicar que la empresa está usando bien el apalancamiento (deuda) 
                  para multiplicar los retornos de los accionistas.
                </p>
              </div>
            </div>

            <div className='bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4'>
              <p className='font-semibold text-yellow-900 mb-2'>⚠️ Importante:</p>
              <p className='text-yellow-800 text-sm'>
                Un ROI muy alto puede ser positivo, pero también puede indicar un patrimonio pequeño en relación 
                al tamaño de la empresa (exceso de apalancamiento). Considera el contexto y compara con ROA.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

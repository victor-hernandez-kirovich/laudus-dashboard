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
  const [allData, setAllData] = useState<RoaData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredData, setHoveredData] = useState<RoaData | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data/rentabilidad')
        if (!response.ok) throw new Error('Error al cargar datos')
        
        const result = await response.json()
        
        if (result.success && result.data) {
          const sortedData = result.data.sort((a: RoaData, b: RoaData) => 
            b.date.localeCompare(a.date)
          )
          setAllData(sortedData)
          
          // Establecer el año más reciente como seleccionado
          if (sortedData.length > 0) {
            const mostRecentYear = new Date(sortedData[0].date).getFullYear()
            setSelectedYear(mostRecentYear)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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

  if (!allData || allData.length === 0) {
    return (
      <div>
        <Header title='ROA - Return on Assets' subtitle='No hay datos disponibles' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-500'>No se encontraron datos</div>
        </div>
      </div>
    )
  }

  // Obtener años disponibles
  const availableYears = Array.from(
    new Set(allData.map(d => new Date(d.date).getFullYear()))
  ).sort((a, b) => b - a)

  // Filtrar datos por año seleccionado
  const filteredData = allData.filter(d => {
    const year = new Date(d.date).getFullYear()
    return year === selectedYear
  })

  const latestData = filteredData.length > 0 ? filteredData[0] : allData[0]
  const displayData = hoveredData || latestData
  
  // Encontrar el mes anterior para comparación
  const displayIndex = filteredData.findIndex(d => d.date === displayData.date)
  const previousData = displayIndex >= 0 && displayIndex < filteredData.length - 1 
    ? filteredData[displayIndex + 1] 
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
        subtitle='Indicador de eficiencia en el uso de activos para generar utilidades'
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
              onChange={(e) => setSelectedYear(Number(e.target.value))}
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
        {filteredData.length === 0 ? (
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
          {filteredData.length > 1 && (
            <RoaChart 
              data={filteredData.slice(0, 12)} 
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

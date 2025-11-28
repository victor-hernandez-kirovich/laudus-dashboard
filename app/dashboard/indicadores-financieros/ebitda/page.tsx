'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { EbitdaChart } from '@/components/charts/EbitdaChart'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface BalanceData {
  date: string
  data: Array<{
    accountNumber: string
    accountName: string
    incomes: number
    expenses: number
  }>
}

interface EbitdaData {
  date: string
  ebitda: number
  margenEbitda: number
  ingresos: number
  gastos: number
  gastosOperacionales: number
  gastosFinancieros: number
  depreciacion: number
  impuestos: number
  utilidadOperacional: number
}

export default function EbitdaPage() {
  const [allData, setAllData] = useState<BalanceData[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredData, setHoveredData] = useState<EbitdaData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data/8columns')
        if (!response.ok) throw new Error('Error al cargar datos')
        
        const result = await response.json()
        
        if (result.success && result.data) {
          // Ordenar por fecha descendente (más reciente primero)
          const sortedData = result.data.sort((a: BalanceData, b: BalanceData) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime()
          })
          setAllData(sortedData)
          
          // Seleccionar el año más reciente por defecto
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
  
  // Obtener años disponibles
  const availableYears = Array.from(
    new Set(allData.map(d => new Date(d.date).getFullYear()))
  ).sort((a, b) => b - a)
  
  // Filtrar datos por año seleccionado
  const filteredData = allData.filter(d => {
    const year = new Date(d.date).getFullYear()
    return year === selectedYear
  })

  const formatSpanishDate = (dateString: string): string => {
    const [year, month] = dateString.split('-').map(Number)
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${months[month - 1]} ${year}`
  }

  // Calcular EBITDA para cada fecha
  const calculateEbitda = (): EbitdaData[] => {
    return filteredData.map(record => {
      const records = record.data || []
      
      // Buscar cuentas necesarias
      const filaSumas = records.find((r: any) => r.accountName === "Sumas")
      const cuenta31 = records.find((r: any) => r.accountNumber === "31") // Costo de Explotación
      const cuenta32 = records.find((r: any) => r.accountNumber === "32") // Gastos Operacionales
      const cuenta3301 = records.find((r: any) => r.accountNumber === "3301") // Depreciación
      const cuenta3401 = records.find((r: any) => r.accountNumber === "3401") // Gastos Financieros
      const cuenta36 = records.find((r: any) => r.accountNumber === "36") // Impuestos
      
      if (!filaSumas) {
        return {
          date: record.date,
          ebitda: 0,
          margenEbitda: 0,
          ingresos: 0,
          gastos: 0,
          gastosOperacionales: 0,
          gastosFinancieros: 0,
          depreciacion: 0,
          impuestos: 0,
          utilidadOperacional: 0
        }
      }
      
      const ingresos = filaSumas.incomes || 0
      const gastos = filaSumas.expenses || 0
      
      const costoExplotacion = cuenta31?.expenses || 0
      const gastosOperacionales = cuenta32?.expenses || 0
      const totalGastosOperacionales = costoExplotacion + gastosOperacionales
      
      const depreciacion = cuenta3301?.expenses || 0
      const gastosFinancieros = cuenta3401?.expenses || 0
      const impuestos = cuenta36?.expenses || 0
      
      const utilidadOperacional = ingresos - totalGastosOperacionales
      
      // EBITDA = Utilidad Operacional + Depreciación + Amortización
      // En este caso, solo tenemos depreciación registrada
      const ebitda = utilidadOperacional + depreciacion
      
      // Margen EBITDA = (EBITDA / Ingresos) * 100
      const margenEbitda = ingresos > 0 ? (ebitda / ingresos) * 100 : 0
      
      return {
        date: record.date,
        ebitda: ebitda,
        margenEbitda: margenEbitda,
        ingresos: ingresos,
        gastos: gastos,
        gastosOperacionales: totalGastosOperacionales,
        gastosFinancieros: gastosFinancieros,
        depreciacion: depreciacion,
        impuestos: impuestos,
        utilidadOperacional: utilidadOperacional
      }
    })
  }

  // Determinar color según el margen EBITDA
  const getEbitdaColor = (margen: number): string => {
    if (margen >= 20) return '#10b981' // Verde - Excelente
    if (margen >= 15) return '#3b82f6' // Azul - Bueno
    if (margen >= 10) return '#f59e0b' // Amarillo - Regular
    return '#ef4444' // Rojo - Bajo
  }

  const getEbitdaLabel = (margen: number): string => {
    if (margen >= 20) return 'Excelente'
    if (margen >= 15) return 'Bueno'
    if (margen >= 10) return 'Regular'
    return 'Bajo'
  }

  if (loading) {
    return (
      <div>
        <Header title='EBITDA' subtitle='Earnings Before Interest, Taxes, Depreciation and Amortization' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-600'>Cargando datos...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Header title='EBITDA' subtitle='Earnings Before Interest, Taxes, Depreciation and Amortization' />
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
        <Header title='EBITDA' subtitle='No hay datos disponibles' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-500'>No se encontraron datos</div>
        </div>
      </div>
    )
  }

  const ebitdaData = calculateEbitda()
  
  if (!ebitdaData || ebitdaData.length === 0) {
    return (
      <div>
        <Header title='EBITDA' subtitle='No hay datos disponibles para el año seleccionado' />
        <div className='p-4 sm:p-6 lg:p-8'>
          <div className="flex justify-end mb-6">
            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Año:
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-4 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-900"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className='text-center py-12 text-gray-500'>
            No se encontraron datos para el año {selectedYear}
          </div>
        </div>
      </div>
    )
  }
  
  const latestEbitda = ebitdaData[0]
  
  // Usar hoveredData si existe, sino usar latestEbitda
  const displayData = hoveredData || latestEbitda
  
  // Encontrar el índice de displayData para obtener el mes anterior
  const displayIndex = ebitdaData.findIndex(d => d.date === displayData.date)
  const previousEbitda = displayIndex >= 0 && displayIndex < ebitdaData.length - 1 
    ? ebitdaData[displayIndex + 1] 
    : null
  
  // Calcular cambio vs mes anterior
  const cambioVsMesAnterior = previousEbitda 
    ? displayData.margenEbitda - previousEbitda.margenEbitda 
    : 0
  
  const cambioEbitdaAbsoluto = previousEbitda
    ? displayData.ebitda - previousEbitda.ebitda
    : 0
  
  const tendencia = cambioVsMesAnterior > 0 ? 'up' : cambioVsMesAnterior < 0 ? 'down' : 'neutral'

  const ebitdaColor = getEbitdaColor(displayData.margenEbitda)
  const ebitdaLabel = getEbitdaLabel(displayData.margenEbitda)

  return (
    <div>
      <Header
        title='EBITDA'
        subtitle='Indicador de rentabilidad operativa antes de intereses, impuestos, depreciación y amortización'
      />

      <div className='p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8'>
        {/* Selector de Año */}
        <div className="flex justify-end">
          <div className="bg-gray-50 border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Año:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-900"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Grid con Gauge y Gráfico */}
        {/* Grid con Gauge y Gráfico */}
        <div className='grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6'>
          {/* Gauge EBITDA */}
          <Card title={`EBITDA - ${formatSpanishDate(displayData.date)}`}>
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
                {/* Progreso del círculo */}
                <circle
                  cx='50'
                  cy='50'
                  r='40'
                  fill='none'
                  stroke={ebitdaColor}
                  strokeWidth='8'
                  strokeDasharray={`${(displayData.margenEbitda / 100) * 251.2} 251.2`}
                  strokeLinecap='round'
                  className='transition-all duration-300'
                />
              </svg>
              {/* Texto central */}
              <div className='absolute inset-0 flex flex-col items-center justify-center'>
                <div className='text-4xl font-bold transition-colors duration-300' style={{ color: ebitdaColor }}>
                  {displayData.margenEbitda.toFixed(1)}%
                </div>
                <div className='text-xs font-semibold mt-1 text-gray-600'>
                  Margen EBITDA
                </div>
                <div className='text-sm font-semibold mt-0.5 transition-colors duration-300' style={{ color: ebitdaColor }}>
                  {ebitdaLabel}
                </div>
              </div>
            </div>

            {/* EBITDA en monto */}
            <div className='text-center mb-3'>
              <div className='text-xs text-gray-600 mb-1'>EBITDA</div>
              <div className='text-2xl font-bold text-blue-600 transition-all duration-300'>
                {formatCurrency(displayData.ebitda)}
              </div>
            </div>

            {/* Comparación con mes anterior */}
            {previousEbitda && (
              <div className='flex flex-col items-center gap-2'>
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
                <div className='text-xs text-gray-600'>
                  {cambioEbitdaAbsoluto >= 0 ? '+' : ''}{formatCurrency(cambioEbitdaAbsoluto)} en valor absoluto
                </div>
              </div>
            )}
            </div>
          </Card>

          {/* Gráfico de Evolución */}
          {ebitdaData.length > 1 && (
            <EbitdaChart 
              data={ebitdaData.slice(0, 12)} 
              onHover={setHoveredData}
            />
          )}
        </div>

        {/* Explicación del EBITDA */}
        <Card title='¿Qué es el EBITDA?'>
          <div className='text-sm text-gray-700 space-y-4'>
            <p>
              El <strong>EBITDA</strong> (Earnings Before Interest, Taxes, Depreciation and Amortization) 
              es un indicador financiero que mide la <strong>rentabilidad operativa</strong> de la empresa 
              antes de considerar los efectos de:
            </p>
            
            <ul className='space-y-2 pl-4'>
              <li className='flex items-start gap-2'>
                <span className='text-blue-600 font-bold'>•</span>
                <span>
                  <strong>Intereses (I):</strong> Costos financieros por deudas
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-blue-600 font-bold'>•</span>
                <span>
                  <strong>Impuestos (T):</strong> Impuesto a la renta
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-blue-600 font-bold'>•</span>
                <span>
                  <strong>Depreciación (D):</strong> Pérdida de valor de activos tangibles
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-blue-600 font-bold'>•</span>
                <span>
                  <strong>Amortización (A):</strong> Pérdida de valor de activos intangibles
                </span>
              </li>
            </ul>

            <div className='bg-green-50 border-l-4 border-green-500 p-4 my-4'>
              <p className='font-semibold text-green-900 mb-2'>¿Por qué es importante?</p>
              <ul className='space-y-1 text-green-800 text-sm'>
                <li>• Mide la <strong>capacidad de generar caja</strong> del negocio</li>
                <li>• Permite comparar empresas sin efectos de estructura financiera</li>
                <li>• Es útil para valoración de empresas (múltiplos de EBITDA)</li>
                <li>• Refleja la <strong>eficiencia operativa pura</strong> del negocio</li>
              </ul>
            </div>

            <div>
              <p className='font-semibold mb-2'>Rangos de Referencia (Margen EBITDA):</p>
              <ul className='space-y-2 pl-4'>
                <li className='flex items-start gap-2'>
                  <span className='text-green-600 font-bold'>•</span>
                  <span>
                    <strong className='text-green-600'>≥ 20%:</strong> Excelente - Alta rentabilidad operativa
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-blue-600 font-bold'>•</span>
                  <span>
                    <strong className='text-blue-600'>15-20%:</strong> Bueno - Rentabilidad saludable
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-orange-600 font-bold'>•</span>
                  <span>
                    <strong className='text-orange-600'>10-15%:</strong> Regular - Hay margen de mejora
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-red-600 font-bold'>•</span>
                  <span>
                    <strong className='text-red-600'>&lt; 10%:</strong> Bajo - Revisar eficiencia operativa
                  </span>
                </li>
              </ul>
            </div>

            <div className='bg-gray-50 p-4 rounded-lg mt-4'>
              <p className='font-semibold mb-2'>Ejemplo con tus datos actuales:</p>
              <div className='font-mono text-xs space-y-1'>
                <p>Ingresos: {formatCurrency(latestEbitda.ingresos)}</p>
                <p>(-) Gastos Operacionales: {formatCurrency(latestEbitda.gastosOperacionales)}</p>
                <p className='border-t pt-1'>= Utilidad Operacional: {formatCurrency(latestEbitda.utilidadOperacional)}</p>
                <p>(+) Depreciación: {formatCurrency(latestEbitda.depreciacion)}</p>
                <p className='border-t pt-1 font-bold'>= EBITDA: {formatCurrency(latestEbitda.ebitda)}</p>
                <p className='mt-2 text-blue-600'>Margen EBITDA = {latestEbitda.margenEbitda.toFixed(2)}%</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

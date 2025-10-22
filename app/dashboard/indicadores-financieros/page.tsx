'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Calendar, Info, TrendingUp, TrendingDown } from 'lucide-react'
import { CurrentRatioChart } from '@/components/charts/CurrentRatioChart'

interface RatioData {
  date: string
  ratio: number
  activos: number
  pasivos: number
}

export default function IndicadoresFinancierosPage() {
  const [allData, setAllData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState(30)
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day')

  const formatSpanishDate = (dateString: string): string => {
    const date = new Date(dateString)
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data/8columns')
        if (!res.ok) throw new Error('Error al cargar datos')
        const result = await res.json()
        setAllData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Calcular Current Ratio para cada fecha
  const calculateCurrentRatios = (): RatioData[] => {
    return allData.map(record => {
      const records = record.data || []
      
      // Buscar Activos Corrientes (accountNumber "11")
      const activosCorrientes = records.find((r: any) => r.accountNumber === "11")
      const activos = activosCorrientes?.assets || 0
      
      // Buscar Pasivos Corrientes (accountNumber "21")
      const pasivosCorrientes = records.find((r: any) => r.accountNumber === "21")
      const pasivos = pasivosCorrientes?.liabilities || 0
      
      // Calcular ratio
      const ratio = pasivos > 0 ? activos / pasivos : 0
      
      return {
        date: record.date,
        ratio: ratio,
        activos: activos,
        pasivos: pasivos
      }
    })
  }

  if (loading) {
    return (
      <div>
        <Header title='Indicadores Financieros' subtitle='Análisis de ratios e indicadores' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-600'>Cargando datos...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Header title='Indicadores Financieros' subtitle='Análisis de ratios e indicadores' />
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
        <Header title='Indicadores Financieros' subtitle='No hay datos disponibles' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-500'>No se encontraron datos</div>
        </div>
      </div>
    )
  }

  const currentRatios = calculateCurrentRatios()
  const latestRatio = currentRatios[0]
  const currentRatio = latestRatio?.ratio || 0
  const activos = latestRatio?.activos || 0
  const pasivos = latestRatio?.pasivos || 0

  return (
    <div>
      <Header
        title='Indicadores Financieros'
        subtitle='Análisis de ratios e indicadores de liquidez y rentabilidad'
      />

      <div className='p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8'>
        {/* CASO 1: Solo 1 fecha - Vista simple */}
        {allData.length === 1 && (
          <>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Card: Current Ratio Actual */}
              <Card title={`Current Ratio - ${formatSpanishDate(allData[0].date)}`}>
                <div className='text-center py-8'>
                  <div className='text-7xl font-bold text-blue-600'>
                    {currentRatio.toFixed(2)}
                  </div>
                  <div className='mt-4 text-lg'>
                    {currentRatio > 1.5 ? (
                      <span className='text-green-600 font-semibold flex items-center justify-center gap-2'>
                        <TrendingUp className='h-6 w-6' />
                        Liquidez Saludable
                      </span>
                    ) : currentRatio >= 1 ? (
                      <span className='text-orange-600 font-semibold flex items-center justify-center gap-2'>
                        <TrendingDown className='h-6 w-6' />
                        Liquidez Aceptable
                      </span>
                    ) : (
                      <span className='text-red-600 font-semibold flex items-center justify-center gap-2'>
                        <TrendingDown className='h-6 w-6' />
                        Liquidez Baja
                      </span>
                    )}
                  </div>
                </div>
              </Card>

              {/* Card: Desglose */}
              <Card title="Desglose">
                <div className='space-y-4 py-4'>
                  <div className='flex justify-between items-center pb-3 border-b'>
                    <span className='text-gray-600'>Activos Corrientes</span>
                    <span className='text-xl font-bold text-blue-600'>
                      {formatCurrency(activos)}
                    </span>
                  </div>
                  <div className='flex justify-between items-center pb-3 border-b'>
                    <span className='text-gray-600'>Pasivos Corrientes</span>
                    <span className='text-xl font-bold text-red-600'>
                      {formatCurrency(pasivos)}
                    </span>
                  </div>
                  <div className='flex justify-between items-center pt-3'>
                    <span className='text-gray-600 font-semibold'>Current Ratio</span>
                    <span className='text-2xl font-bold text-gray-900'>
                      {currentRatio.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Interpretación */}
            <Card title="Interpretación del Current Ratio">
              <div className='text-sm text-gray-700 space-y-3'>
                <p>
                  El <strong>Current Ratio</strong> mide la capacidad de la empresa para pagar sus obligaciones de corto plazo con sus activos corrientes.
                </p>
                <p>Tu ratio actual es <strong className='text-blue-600 text-lg'>{currentRatio.toFixed(2)}</strong>, lo que significa que por cada $1 de pasivo corriente, tienes ${currentRatio.toFixed(2)} de activos corrientes.</p>
                <ul className='mt-4 space-y-2 pl-4'>
                  <li className='flex items-start gap-2'>
                    <span className='text-red-600'>•</span>
                    <span><strong>Menor a 1:</strong> Problemas de liquidez - Riesgo de no poder pagar deudas</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-orange-600'>•</span>
                    <span><strong>Entre 1 y 1.5:</strong> Liquidez aceptable - Cumple obligaciones pero con margen ajustado</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-green-600'>•</span>
                    <span><strong>Mayor a 1.5:</strong> Buena liquidez - Capacidad sólida para pagar deudas</span>
                  </li>
                </ul>
              </div>
            </Card>

            {/* Mensaje informativo */}
            <Card>
              <div className='flex items-center gap-3 text-sm text-gray-600'>
                <Info className='h-5 w-5 text-blue-500 flex-shrink-0' />
                <p>
                  Los gráficos de evolución aparecerán cuando haya datos de múltiples fechas. El sistema guarda automáticamente un nuevo balance cada día.
                </p>
              </div>
            </Card>
          </>
        )}

        {/* CASO 2: 2-5 fechas - Vista con tabla */}
        {allData.length > 1 && allData.length <= 5 && (
          <>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* Valor actual */}
              <Card title="Current Ratio Actual">
                <div className='text-center py-6'>
                  <div className='text-5xl font-bold text-blue-600'>
                    {currentRatio.toFixed(2)}
                  </div>
                  <div className='mt-3 text-sm'>
                    {currentRatio > 1.5 ? (
                      <span className='text-green-600 font-semibold'>✓ Saludable</span>
                    ) : currentRatio >= 1 ? (
                      <span className='text-orange-600 font-semibold'>⚠ Aceptable</span>
                    ) : (
                      <span className='text-red-600 font-semibold'>✗ Bajo</span>
                    )}
                  </div>
                </div>
              </Card>

              {/* Tabla de valores históricos */}
              <Card title="Histórico Reciente" className='lg:col-span-2'>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='text-left text-sm text-gray-600 border-b'>
                        <th className='pb-2'>Fecha</th>
                        <th className='text-right pb-2'>Activos</th>
                        <th className='text-right pb-2'>Pasivos</th>
                        <th className='text-right pb-2'>Ratio</th>
                        <th className='text-center pb-2'>Tendencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRatios.map((item, idx) => (
                        <tr key={idx} className='border-t hover:bg-gray-50'>
                          <td className='py-3'>{formatSpanishDate(item.date)}</td>
                          <td className='text-right text-sm'>{formatCurrency(item.activos)}</td>
                          <td className='text-right text-sm'>{formatCurrency(item.pasivos)}</td>
                          <td className='text-right font-semibold'>{item.ratio.toFixed(2)}</td>
                          <td className='text-center'>
                            {idx < currentRatios.length - 1 && (
                              item.ratio > currentRatios[idx + 1].ratio ? 
                                <span className='text-green-600 text-xl'>↑</span> : 
                              item.ratio < currentRatios[idx + 1].ratio ?
                                <span className='text-red-600 text-xl'>↓</span> :
                                <span className='text-gray-400 text-xl'>→</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Interpretación */}
            <Card title="Interpretación del Current Ratio">
              <div className='text-sm text-gray-700'>
                <p>
                  Tu ratio actual es <strong className='text-blue-600 text-lg'>{currentRatio.toFixed(2)}</strong>. 
                  {currentRatio > 1.5 ? ' Esto indica una buena liquidez.' : currentRatio >= 1 ? ' Liquidez aceptable.' : ' Requiere atención.'}
                </p>
              </div>
            </Card>
          </>
        )}

        {/* CASO 3: Más de 5 fechas - Vista completa con gráfico */}
        {allData.length > 5 && (
          <>
            {/* Controles de período */}
            <Card>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-5 w-5 text-blue-600' />
                  <label className='text-sm font-medium text-gray-700'>Período:</label>
                  <div className='flex gap-2'>
                    <button 
                      onClick={() => setPeriod(7)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        period === 7 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      7 días
                    </button>
                    <button 
                      onClick={() => setPeriod(15)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        period === 15 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      15 días
                    </button>
                    <button 
                      onClick={() => setPeriod(30)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        period === 30 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      30 días
                    </button>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <label className='text-sm font-medium text-gray-700'>Agrupar por:</label>
                  <select 
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
                    className='px-3 py-1 text-sm border border-gray-300 rounded-md bg-white'
                  >
                    <option value="day">Día</option>
                    <option value="week">Semana</option>
                    <option value="month">Mes</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Gráfico de evolución */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <div className='lg:col-span-2'>
                <CurrentRatioChart data={currentRatios.slice(0, period)} />
              </div>
              
              <Card title="Ratio Actual">
                <div className='text-center py-6'>
                  <div className='text-5xl font-bold text-blue-600'>
                    {currentRatio.toFixed(2)}
                  </div>
                  <div className='mt-3 text-sm'>
                    {currentRatio > 1.5 ? (
                      <span className='text-green-600 font-semibold'>✓ Saludable</span>
                    ) : currentRatio >= 1 ? (
                      <span className='text-orange-600 font-semibold'>⚠ Aceptable</span>
                    ) : (
                      <span className='text-red-600 font-semibold'>✗ Bajo</span>
                    )}
                  </div>
                  <div className='mt-6 text-left space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Activos:</span>
                      <span className='font-semibold'>{formatCurrency(activos)}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Pasivos:</span>
                      <span className='font-semibold'>{formatCurrency(pasivos)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Interpretación */}
            <Card title="Interpretación del Current Ratio">
              <div className='text-sm text-gray-700'>
                <p>
                  El Current Ratio mide la liquidez de corto plazo. Un valor superior a 1.5 es considerado saludable.
                </p>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

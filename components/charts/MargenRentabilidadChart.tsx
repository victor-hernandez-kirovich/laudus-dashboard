'use client'

import { Card } from '@/components/ui/Card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface MargenRentabilidadChartProps {
  data: Array<{
    date: string
    margenNeto: number
    margenOperacional: number
    ingresos: number
    gastos: number
    gastosOperacionales: number
    utilidadNeta: number
    utilidadOperacional: number
  }>
}

export function MargenRentabilidadChart({ data }: MargenRentabilidadChartProps) {
  const formatSpanishDate = (dateString: string): string => {
    const [year, month] = dateString.split('-').map(Number)
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ]
    return months[month - 1]
  }

  // Preparar datos para el gráfico (ya vienen ordenados cronológicamente desde la página)
  const chartData = data.map(item => ({
    ...item,
    dateFormatted: formatSpanishDate(item.date)
  }))

  // Formatear valores del eje Y en millones
  const formatYAxis = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}K`
    }
    return value.toString()
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className='bg-white p-4 rounded-lg shadow-lg border border-gray-200'>
          <p className='font-semibold text-gray-900 mb-3'>{data.dateFormatted}</p>
          <div className='space-y-2 text-sm'>
            <div className='pb-2 border-b border-gray-200'>
              <div className='flex items-center justify-between gap-4'>
                <span className='text-blue-600 font-medium'>Utilidad Neta:</span>
                <span className='font-bold text-blue-700'>{formatCurrency(data.utilidadNeta)}</span>
              </div>
              <div className='flex items-center justify-between gap-4 mt-1'>
                <span className='text-green-600 font-medium'>Utilidad Operacional:</span>
                <span className='font-bold text-green-700'>{formatCurrency(data.utilidadOperacional)}</span>
              </div>
            </div>
            <div className='pb-2 border-b border-gray-200'>
              <div className='flex items-center justify-between gap-4'>
                <span className='text-blue-600 font-medium'>Margen Neto:</span>
                <span className='font-bold text-blue-700'>{data.margenNeto.toFixed(2)}%</span>
              </div>
              <div className='flex items-center justify-between gap-4 mt-1'>
                <span className='text-green-600 font-medium'>Margen Operacional:</span>
                <span className='font-bold text-green-700'>{data.margenOperacional.toFixed(2)}%</span>
              </div>
            </div>
            <div className='flex items-center justify-between gap-4'>
              <span className='text-green-700 font-medium'>Ingresos:</span>
              <span className='font-bold text-green-800'>{formatCurrency(data.ingresos)}</span>
            </div>
            <div className='flex items-center justify-between gap-4'>
              <span className='text-orange-600 font-medium'>Gastos Operacionales:</span>
              <span className='font-bold text-orange-700'>{formatCurrency(data.gastosOperacionales)}</span>
            </div>
            <div className='flex items-center justify-between gap-4'>
              <span className='text-red-700 font-medium'>Gastos Totales:</span>
              <span className='font-bold text-red-800'>{formatCurrency(data.gastos)}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card title='Evolución de la Rentabilidad' subtitle='Utilidad Neta y Operacional por mes'>
      <div className='h-96'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
            <XAxis
              dataKey='dateFormatted'
              tick={{ fontSize: 12 }}
              stroke='#6b7280'
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke='#6b7280'
              tickFormatter={formatYAxis}
              label={{ value: 'Monto ($)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 14, paddingTop: '10px' }}
              iconType='line'
            />
            {/* Línea de referencia en 0 */}
            <ReferenceLine
              y={0}
              stroke='#9ca3af'
              strokeDasharray='3 3'
            />
            <Line
              type='monotone'
              dataKey='utilidadNeta'
              stroke='#3b82f6'
              strokeWidth={3}
              name='Utilidad Neta'
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line
              type='monotone'
              dataKey='utilidadOperacional'
              stroke='#10b981'
              strokeWidth={3}
              name='Utilidad Operacional'
              dot={{ fill: '#10b981', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda adicional con estadísticas de ambos márgenes */}
      <div className='mt-4 pt-4 border-t border-gray-200'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Estadísticas Utilidad Neta */}
          <div>
            <h4 className='text-sm font-semibold text-blue-700 mb-3'>Utilidad Neta</h4>
            <div className='grid grid-cols-3 gap-4 text-sm'>
              <div className='text-center'>
                <div className='text-gray-600'>Promedio</div>
                <div className='text-lg font-bold text-blue-600'>
                  {formatCurrency(chartData.reduce((sum, item) => sum + item.utilidadNeta, 0) / chartData.length)}
                </div>
              </div>
              <div className='text-center'>
                <div className='text-gray-600'>Máximo</div>
                <div className='text-lg font-bold text-green-600'>
                  {formatCurrency(Math.max(...chartData.map(item => item.utilidadNeta)))}
                </div>
              </div>
              <div className='text-center'>
                <div className='text-gray-600'>Mínimo</div>
                <div className='text-lg font-bold text-orange-600'>
                  {formatCurrency(Math.min(...chartData.map(item => item.utilidadNeta)))}
                </div>
              </div>
            </div>
            <div className='mt-2 text-center'>
              <span className='text-gray-600 text-sm'>Margen Promedio: </span>
              <span className='font-bold text-blue-600'>
                {(chartData.reduce((sum, item) => sum + item.margenNeto, 0) / chartData.length).toFixed(2)}%
              </span>
            </div>
          </div>
          
          {/* Estadísticas Utilidad Operacional */}
          <div>
            <h4 className='text-sm font-semibold text-green-700 mb-3'>Utilidad Operacional</h4>
            <div className='grid grid-cols-3 gap-4 text-sm'>
              <div className='text-center'>
                <div className='text-gray-600'>Promedio</div>
                <div className='text-lg font-bold text-blue-600'>
                  {formatCurrency(chartData.reduce((sum, item) => sum + item.utilidadOperacional, 0) / chartData.length)}
                </div>
              </div>
              <div className='text-center'>
                <div className='text-gray-600'>Máximo</div>
                <div className='text-lg font-bold text-green-600'>
                  {formatCurrency(Math.max(...chartData.map(item => item.utilidadOperacional)))}
                </div>
              </div>
              <div className='text-center'>
                <div className='text-gray-600'>Mínimo</div>
                <div className='text-lg font-bold text-orange-600'>
                  {formatCurrency(Math.min(...chartData.map(item => item.utilidadOperacional)))}
                </div>
              </div>
            </div>
            <div className='mt-2 text-center'>
              <span className='text-gray-600 text-sm'>Margen Promedio: </span>
              <span className='font-bold text-green-600'>
                {(chartData.reduce((sum, item) => sum + item.margenOperacional, 0) / chartData.length).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

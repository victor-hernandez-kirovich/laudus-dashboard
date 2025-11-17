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
    ingresos: number
    gastos: number
    utilidadNeta: number
  }>
}

export function MargenRentabilidadChart({ data }: MargenRentabilidadChartProps) {
  const formatSpanishDate = (dateString: string): string => {
    const [year, month, day] = dateString.split('-').map(Number)
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ]
    return `${day} ${months[month - 1]}`
  }

  // Preparar datos para el gráfico (invertir orden para mostrar cronológicamente)
  const chartData = [...data].reverse().map(item => ({
    ...item,
    dateFormatted: formatSpanishDate(item.date)
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className='bg-white p-4 rounded-lg shadow-lg border border-gray-200'>
          <p className='font-semibold text-gray-900 mb-2'>{data.dateFormatted}</p>
          <div className='space-y-1 text-sm'>
            <div className='flex items-center justify-between gap-4'>
              <span className='text-blue-600 font-medium'>Margen Neto:</span>
              <span className='font-bold text-blue-700'>{data.margenNeto.toFixed(2)}%</span>
            </div>
            <div className='flex items-center justify-between gap-4'>
              <span className='text-green-700 font-medium'>Ingresos:</span>
              <span className='font-bold text-green-800'>{formatCurrency(data.ingresos)}</span>
            </div>
            <div className='flex items-center justify-between gap-4'>
              <span className='text-red-700 font-medium'>Gastos:</span>
              <span className='font-bold text-red-800'>{formatCurrency(data.gastos)}</span>
            </div>
            <div className='border-t pt-1 mt-1 flex items-center justify-between gap-4'>
              <span className='text-gray-700 font-medium'>Utilidad Neta:</span>
              <span className='font-bold text-gray-900'>{formatCurrency(data.utilidadNeta)}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card title='Evolución del Margen de Rentabilidad' subtitle='Últimos meses'>
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
              label={{ value: 'Margen (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 14, paddingTop: '10px' }}
              iconType='line'
            />
            {/* Línea de referencia en 50% */}
            <ReferenceLine
              y={50}
              stroke='#9ca3af'
              strokeDasharray='3 3'
              label={{ value: '50%', position: 'right', fontSize: 12, fill: '#6b7280' }}
            />
            <Line
              type='monotone'
              dataKey='margenNeto'
              stroke='#3b82f6'
              strokeWidth={3}
              name='Margen Neto (%)'
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda adicional */}
      <div className='mt-4 pt-4 border-t border-gray-200'>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm'>
          <div className='text-center'>
            <div className='text-gray-600'>Promedio</div>
            <div className='text-lg font-bold text-blue-600'>
              {(chartData.reduce((sum, item) => sum + item.margenNeto, 0) / chartData.length).toFixed(2)}%
            </div>
          </div>
          <div className='text-center'>
            <div className='text-gray-600'>Máximo</div>
            <div className='text-lg font-bold text-green-600'>
              {Math.max(...chartData.map(item => item.margenNeto)).toFixed(2)}%
            </div>
          </div>
          <div className='text-center'>
            <div className='text-gray-600'>Mínimo</div>
            <div className='text-lg font-bold text-orange-600'>
              {Math.min(...chartData.map(item => item.margenNeto)).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

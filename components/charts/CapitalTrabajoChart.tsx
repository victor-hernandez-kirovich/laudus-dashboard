'use client'

import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts'

interface WorkingCapitalData {
  date: string
  workingCapital: number
  activosCorrientes: number
  pasivosCorrientes: number
}

interface CapitalTrabajoChartProps {
  data: WorkingCapitalData[]
}

export function CapitalTrabajoChart({ data }: CapitalTrabajoChartProps) {
  // Preparar datos para el gráfico (invertir orden para mostrar cronológicamente)
  const chartData = [...data].reverse().map(item => ({
    date: new Date(item.date).toLocaleDateString('es-CL', { 
      day: '2-digit', 
      month: 'short' 
    }),
    'Capital de Trabajo': item.workingCapital,
    'Activos Corrientes': item.activosCorrientes,
    'Pasivos Corrientes': item.pasivosCorrientes
  }))

  // Calcular el valor promedio para la línea de referencia
  const avgCapital = data.reduce((sum, item) => sum + item.workingCapital, 0) / data.length

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-white p-4 border border-gray-200 rounded-lg shadow-lg'>
          <p className='font-semibold text-gray-900 mb-2'>{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className='flex items-center justify-between gap-4 text-sm'>
              <span style={{ color: entry.color }} className='font-medium'>
                {entry.name}:
              </span>
              <span className='font-bold'>
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card title='Evolución del Capital de Trabajo' subtitle='Tendencia histórica'>
      <div className='h-80 w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
          >
            <defs>
              <linearGradient id='colorCapital' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.8}/>
                <stop offset='95%' stopColor='#3b82f6' stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id='colorActivos' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#10b981' stopOpacity={0.6}/>
                <stop offset='95%' stopColor='#10b981' stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id='colorPasivos' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#ef4444' stopOpacity={0.6}/>
                <stop offset='95%' stopColor='#ef4444' stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
            <XAxis 
              dataKey='date' 
              stroke='#6b7280'
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor='end'
              height={60}
            />
            <YAxis 
              stroke='#6b7280'
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType='line'
            />
            
            {/* Línea de referencia para el promedio */}
            <ReferenceLine 
              y={avgCapital} 
              stroke='#9ca3af' 
              strokeDasharray='5 5'
              label={{ value: 'Promedio', position: 'insideTopRight', fill: '#6b7280', fontSize: 12 }}
            />
            
            {/* Línea de referencia en 0 */}
            <ReferenceLine 
              y={0} 
              stroke='#374151' 
              strokeWidth={2}
            />
            
            <Area
              type='monotone'
              dataKey='Activos Corrientes'
              stroke='#10b981'
              strokeWidth={2}
              fill='url(#colorActivos)'
              fillOpacity={0.3}
            />
            <Area
              type='monotone'
              dataKey='Pasivos Corrientes'
              stroke='#ef4444'
              strokeWidth={2}
              fill='url(#colorPasivos)'
              fillOpacity={0.3}
            />
            <Area
              type='monotone'
              dataKey='Capital de Trabajo'
              stroke='#3b82f6'
              strokeWidth={3}
              fill='url(#colorCapital)'
              fillOpacity={1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Estadísticas adicionales */}
      <div className='mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t'>
        <div className='text-center'>
          <div className='text-sm text-gray-600'>Promedio</div>
          <div className='text-lg font-bold text-gray-900'>
            {formatCurrency(avgCapital)}
          </div>
        </div>
        <div className='text-center'>
          <div className='text-sm text-gray-600'>Máximo</div>
          <div className='text-lg font-bold text-green-600'>
            {formatCurrency(Math.max(...data.map(d => d.workingCapital)))}
          </div>
        </div>
        <div className='text-center'>
          <div className='text-sm text-gray-600'>Mínimo</div>
          <div className='text-lg font-bold text-red-600'>
            {formatCurrency(Math.min(...data.map(d => d.workingCapital)))}
          </div>
        </div>
      </div>
    </Card>
  )
}

'use client'

import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'

interface WorkingCapitalData {
  date: string
  workingCapital: number
  activosCorrientes: number
  pasivosCorrientes: number
}

interface WorkingCapitalChartProps {
  data: WorkingCapitalData[]
}

export function WorkingCapitalChart({ data }: WorkingCapitalChartProps) {
  const formatSpanishDate = (dateString: string): string => {
    // Usar parsing directo para evitar problemas de zona horaria
    const [year, month] = dateString.split('-').map(Number)
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${months[month - 1]} `
  }

  // Preparar datos para el gráfico
  const chartData = data.map(item => ({
    date: formatSpanishDate(item.date),
    'Capital de Trabajo': item.workingCapital
  }))

  // Calcular estadísticas
  const avgCapital = data.reduce((sum, item) => sum + item.workingCapital, 0) / data.length
  const maxCapital = Math.max(...data.map(d => d.workingCapital))
  const minCapital = Math.min(...data.map(d => d.workingCapital))

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value
      return (
        <div className='bg-white p-4 border border-gray-200 rounded-lg shadow-lg'>
          <p className='font-bold text-gray-900 mb-2' style={{ color: '#111827', fontSize: '14px' }}>{label}</p>
          <div className='flex items-center justify-between gap-4 text-sm'>
            <span className='font-medium' style={{ color: '#d4a574' }}>
              Capital de Trabajo:
            </span>
            <span className='font-bold' style={{ color: '#111827' }}>
              {formatCurrency(value)}
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card title='💼 Capital de Trabajo' subtitle={`Últimos ${data.length} meses`}>
      <div className='h-80 w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
            <XAxis 
              dataKey='date' 
              tick={{ fontSize: 13, fill: '#111827', fontWeight: 600 }}
              stroke='#6b7280'
            />
            <YAxis 
              stroke='#6b7280'
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              iconType='rect'
            />
            
            <Bar 
              dataKey='Capital de Trabajo' 
              fill='#d4a574'
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
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
            {formatCurrency(maxCapital)}
          </div>
        </div>
        <div className='text-center'>
          <div className='text-sm text-gray-600'>Mínimo</div>
          <div className='text-lg font-bold text-red-600'>
            {formatCurrency(minCapital)}
          </div>
        </div>
      </div>

      {/* Fórmula de Cálculo */}
      <div className='mt-6 pt-6 border-t border-gray-200'>
        <h3 className='text-sm font-semibold text-gray-700 mb-4'>📐 Fórmula de Cálculo</h3>
        <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-4xl'>
          <div className='mb-3'>
            <h4 className='font-semibold text-gray-900 mb-2'>Capital de Trabajo</h4>
            <div className='text-sm text-gray-700'>
              <div className='font-mono bg-white px-3 py-2 rounded border border-amber-300'>
                <div className='text-center'>
                  <div className='font-semibold'>CT = Activos Corrientes − Pasivos Corrientes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Interpretación */}
          <div className='mt-4 space-y-2 text-sm'>
            <p className='font-semibold text-gray-800'>💡 Interpretación:</p>
            <div className='space-y-1.5 ml-2'>
              <div className='flex items-start gap-2'>
                <span className='text-green-600 font-bold'>✅</span>
                <span className='text-gray-700'>
                  <strong>CT {'>'} 0:</strong> La empresa tiene recursos líquidos suficientes para cubrir sus obligaciones de corto plazo.
                </span>
              </div>
              <div className='flex items-start gap-2'>
                <span className='text-orange-600 font-bold'>⚠️</span>
                <span className='text-gray-700'>
                  <strong>CT = 0:</strong> Todo el activo corriente está comprometido en el pago de deudas.
                </span>
              </div>
              <div className='flex items-start gap-2'>
                <span className='text-red-600 font-bold'>🚨</span>
                <span className='text-gray-700'>
                  <strong>CT {'<'} 0:</strong> La empresa no puede cubrir sus deudas de corto plazo; hay riesgo de liquidez.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

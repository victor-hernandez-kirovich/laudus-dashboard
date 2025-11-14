'use client'

import { Card } from '@/components/ui/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface CurrentRatioChartProps {
  data: {
    date: string
    ratio: number
    acidTest: number
    activos: number
    pasivos: number
    inventarios: number
  }[]
}

export function CurrentRatioChart({ data }: CurrentRatioChartProps) {
  const formatSpanishDate = (dateString: string): string => {
    // Usar parsing directo para evitar problemas de zona horaria
    const [year, month] = dateString.split('-').map(Number)
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${months[month - 1]} ${year}`
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const chartData = data.map(item => ({
    date: formatSpanishDate(item.date),
    'Ratio Corriente': parseFloat(item.ratio.toFixed(2)),
    'Prueba Ácida': parseFloat(item.acidTest.toFixed(2)),
    activos: item.activos,
    pasivos: item.pasivos,
    inventarios: item.inventarios
  }))

  return (
    <Card title="💧 Ratios de Liquidez" subtitle={`Últimos ${data.length} meses`}>
      <div className='h-80'>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 13, fill: '#111827', fontWeight: 600 }}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              domain={[0, 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px'
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '14px' }}
              formatter={(value: any, name: string) => {
                if (name === 'Ratio Corriente' || name === 'Prueba Ácida') {
                  return [`${value.toFixed(2)}x`, name]
                }
                if (name === 'activos') {
                  return [formatCurrency(value), 'Activos Corrientes']
                }
                if (name === 'pasivos') {
                  return [formatCurrency(value), 'Pasivos Corrientes']
                }
                if (name === 'inventarios') {
                  return [formatCurrency(value), 'Inventarios']
                }
                return [value, name]
              }}
            />
            
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="line"
            />
            
            <Line 
              type="monotone" 
              dataKey="Ratio Corriente" 
              stroke="#1e3a8a" 
              strokeWidth={2}
              dot={{ fill: '#1e3a8a', r: 4 }}
              activeDot={{ r: 6 }}
            />
            
            <Line 
              type="monotone" 
              dataKey="Prueba Ácida" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Fórmulas de Cálculo */}
      <div className='mt-6 pt-6 border-t border-gray-200'>
        <h3 className='text-sm font-semibold text-gray-700 mb-4'>📐 Fórmulas de Cálculo</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Ratio Corriente */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <div className='w-3 h-3 rounded-full bg-[#1e3a8a]'></div>
              <h4 className='font-semibold text-gray-900'>Ratio Corriente</h4>
            </div>
            <div className='text-sm text-gray-700 space-y-2'>
              <div className='font-mono bg-white px-3 py-2 rounded border border-blue-300'>
                <div className='text-center'>
                  <div className='border-b border-gray-400 pb-1 mb-1'>Activos Corrientes</div>
                  <div>Pasivos Corrientes</div>
                </div>
              </div>
              <p className='text-xs text-gray-600 mt-2'>
                Mide la capacidad de pagar deudas de corto plazo con todos los activos corrientes.
              </p>
            </div>
          </div>

          {/* Prueba Ácida */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <div className='w-3 h-3 rounded-full bg-[#3b82f6]'></div>
              <h4 className='font-semibold text-gray-900'>Prueba Ácida</h4>
            </div>
            <div className='text-sm text-gray-700 space-y-2'>
              <div className='font-mono bg-white px-3 py-2 rounded border border-blue-300'>
                <div className='text-center'>
                  <div className='border-b border-gray-400 pb-1 mb-1'>
                    Activos Corrientes − Inventarios
                  </div>
                  <div>Pasivos Corrientes</div>
                </div>
              </div>
              <p className='text-xs text-gray-600 mt-2'>
                Mide la liquidez sin depender de la venta de inventarios (más conservador).
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

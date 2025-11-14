'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface EstructuraFinancieraData {
  date: string
  endeudamiento: number
  autonomia: number
  activoTotal: number
  pasivoTotal: number
  patrimonio: number
}

interface EstructuraFinancieraChartProps {
  data: EstructuraFinancieraData[]
}

export function EstructuraFinancieraChart({ data }: EstructuraFinancieraChartProps) {
  // Estado para almacenar el punto seleccionado
  const [selectedData, setSelectedData] = useState<EstructuraFinancieraData | null>(null)

  // Usar el dato más reciente como default
  useEffect(() => {
    if (data.length > 0) {
      setSelectedData(data[0])
    }
  }, [data])

  const formatSpanishDate = (dateString: string): string => {
    // Usar parsing directo para evitar problemas de zona horaria
    const [year, month] = dateString.split('-').map(Number)
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${months[month - 1]} ${year}`
  }

  const chartData = data.map(item => ({
    date: formatSpanishDate(item.date),
    fullDate: item.date,
    'Endeudamiento': parseFloat(item.endeudamiento.toFixed(2)),
    'Autonomía': parseFloat(item.autonomia.toFixed(2)),
    activoTotal: item.activoTotal,
    pasivoTotal: item.pasivoTotal,
    patrimonio: item.patrimonio,
    originalData: item
  }))

  // Custom Tooltip que actualiza el estado
  const CustomTooltip = ({ active, payload }: any) => {
    useEffect(() => {
      if (active && payload && payload.length > 0) {
        const dataPoint = payload[0].payload.originalData
        if (dataPoint && selectedData?.date !== dataPoint.date) {
          setSelectedData(dataPoint)
        }
      }
    }, [active, payload])
    
    return null
  }

  // Usar selectedData para mostrar valores
  const displayData = selectedData || data[0]
  const displayEndeudamiento = displayData?.endeudamiento || 0
  const displayAutonomia = displayData?.autonomia || 0
  const displayActivoTotal = displayData?.activoTotal || 0
  const displayPasivoTotal = displayData?.pasivoTotal || 0
  const displayPatrimonio = displayData?.patrimonio || 0

  return (
    <Card title="👑 Estructura Financiera" subtitle={`Últimos ${data.length} meses`}>
      {/* Cards Superiores con valores dinámicos */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <div className='bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center'>
          <div className='text-sm text-gray-600 mb-1'>Endeudamiento</div>
          <div className='text-3xl font-bold text-red-600'>
            {displayEndeudamiento.toFixed(2)}%
          </div>
          <div className='text-xs text-gray-500 mt-2'>
            {formatCurrency(displayPasivoTotal)}
          </div>
        </div>
        
        <div className='bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center'>
          <div className='text-sm text-gray-600 mb-1'>Autonomía Financiera</div>
          <div className='text-3xl font-bold text-green-600'>
            {displayAutonomia.toFixed(2)}%
          </div>
          <div className='text-xs text-gray-500 mt-2'>
            {formatCurrency(displayPatrimonio)}
          </div>
        </div>
        
        <div className='bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center'>
          <div className='text-sm text-gray-600 mb-1'>Activo Total</div>
          <div className='text-3xl font-bold text-blue-600'>
            {formatCurrency(displayActivoTotal)}
          </div>
          <div className='text-xs text-gray-500 mt-2'>
            {displayData?.date ? new Date(displayData.date).toLocaleDateString('es-CL') : ''}
          </div>
        </div>
      </div>

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
              domain={[30, 70]}
              tickFormatter={(value) => `${value.toFixed(0)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="line"
            />
            
            <Line 
              type="monotone" 
              dataKey="Endeudamiento" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
            />
            
            <Line 
              type="monotone" 
              dataKey="Autonomía" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Fórmulas de Cálculo con valores dinámicos */}
      <div className='mt-6 pt-6 border-t border-gray-200'>
        <h3 className='text-sm font-semibold text-gray-700 mb-4'>📐 Fórmulas de Cálculo</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl'>
          {/* Endeudamiento */}
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <div className='w-3 h-3 rounded-full bg-[#ef4444]'></div>
              <h4 className='font-semibold text-gray-900'>Endeudamiento</h4>
            </div>
            <div className='text-sm text-gray-700 space-y-2'>
              <div className='font-mono bg-white px-3 py-2 rounded border border-red-300'>
                <div className='text-center'>
                  <div className='border-b border-gray-400 pb-1 mb-1 text-red-600 font-semibold'>
                    {formatCurrency(displayPasivoTotal)}
                  </div>
                  <div className='border-b border-gray-400 pb-1 mb-1 text-blue-600 font-semibold'>
                    {formatCurrency(displayActivoTotal)}
                  </div>
                  <div className='mt-1'>× 100 = <span className='text-red-600 font-bold'>{displayEndeudamiento.toFixed(2)}%</span></div>
                </div>
              </div>
              <p className='text-xs text-gray-600 mt-2'>
                Indica qué porcentaje de los activos se financia con deuda.
              </p>
            </div>
          </div>

          {/* Autonomía */}
          <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <div className='w-3 h-3 rounded-full bg-[#10b981]'></div>
              <h4 className='font-semibold text-gray-900'>Autonomía Financiera</h4>
            </div>
            <div className='text-sm text-gray-700 space-y-2'>
              <div className='font-mono bg-white px-3 py-2 rounded border border-green-300'>
                <div className='text-center'>
                  <div className='border-b border-gray-400 pb-1 mb-1 text-green-600 font-semibold'>
                    {formatCurrency(displayPatrimonio)}
                  </div>
                  <div className='border-b border-gray-400 pb-1 mb-1 text-blue-600 font-semibold'>
                    {formatCurrency(displayActivoTotal)}
                  </div>
                  <div className='mt-1'>× 100 = <span className='text-green-600 font-bold'>{displayAutonomia.toFixed(2)}%</span></div>
                </div>
              </div>
              <p className='text-xs text-gray-600 mt-2'>
                Indica qué porcentaje de los activos se financia con recursos propios.
              </p>
            </div>
          </div>
        </div>

        {/* Interpretación */}
        <div className='mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-4xl'>
          <p className='font-semibold text-gray-800 mb-3'>💡 Interpretación:</p>
          <div className='space-y-2 text-sm'>
            <div className='flex items-start gap-2'>
              <span className='text-green-600 font-bold'>✅</span>
              <span className='text-gray-700'>
                <strong>Alta autonomía ({'>'} 70%):</strong> Estructura financiera sólida y conservadora.
              </span>
            </div>
            <div className='flex items-start gap-2'>
              <span className='text-blue-600 font-bold'>⚖️</span>
              <span className='text-gray-700'>
                <strong>Endeudamiento moderado (30-40%):</strong> Balance saludable entre deuda y capital propio.
              </span>
            </div>
            <div className='flex items-start gap-2'>
              <span className='text-orange-600 font-bold'>⚠️</span>
              <span className='text-gray-700'>
                <strong>Alto endeudamiento ({'>'} 60%):</strong> Mayor riesgo financiero y dependencia de terceros.
              </span>
            </div>
            <div className='mt-3 pt-3 border-t border-gray-300'>
              <p className='text-xs text-gray-600'>
                <strong>Nota:</strong> Endeudamiento + Autonomía siempre suman 100%
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

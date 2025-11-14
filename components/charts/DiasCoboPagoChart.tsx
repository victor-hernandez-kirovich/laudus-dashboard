'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DiasCoboPagoData {
  date: string
  diasCobro: number
  diasPago: number
  cuentasPorCobrar: number
  cuentasPorPagar: number
  ingresos: number
  costoVentas: number
  gap: number
}

interface DiasCoboPagoChartProps {
  data: DiasCoboPagoData[]
}

export function DiasCoboPagoChart({ data }: DiasCoboPagoChartProps) {
  // Estado para almacenar el punto seleccionado
  const [selectedData, setSelectedData] = useState<DiasCoboPagoData | null>(null)

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
    'Días Cobro': parseFloat(item.diasCobro.toFixed(2)),
    'Días Pago': parseFloat(item.diasPago.toFixed(2)),
    cuentasPorCobrar: item.cuentasPorCobrar,
    cuentasPorPagar: item.cuentasPorPagar,
    ingresos: item.ingresos,
    costoVentas: item.costoVentas,
    gap: item.gap,
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
  const displayDiasCobro = displayData?.diasCobro || 0
  const displayDiasPago = displayData?.diasPago || 0
  const displayGap = displayData?.gap || 0
  const displayCxC = displayData?.cuentasPorCobrar || 0
  const displayCxP = displayData?.cuentasPorPagar || 0
  const displayIngresos = displayData?.ingresos || 0
  const displayCostoVentas = displayData?.costoVentas || 0

  // Determinar el estado del gap
  const gapStatus = displayGap < 0 ? 'negativo' : displayGap > 0 ? 'positivo' : 'neutro'
  const gapColor = gapStatus === 'negativo' ? 'text-red-600' : gapStatus === 'positivo' ? 'text-green-600' : 'text-gray-600'
  const gapBg = gapStatus === 'negativo' ? 'bg-red-50 border-red-200' : gapStatus === 'positivo' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'

  return (
    <Card title="💰 Días de Cobro y Pago" subtitle={`Últimos ${data.length} meses`}>
      {/* Cards Superiores con valores dinámicos */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <div className='bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center'>
          <div className='text-sm text-gray-600 mb-1'>Días de Cobro (DSO)</div>
          <div className='text-3xl font-bold text-blue-600'>
            {displayDiasCobro.toFixed(0)} días
          </div>
          <div className='text-xs text-gray-500 mt-2'>
            CxC: {formatCurrency(displayCxC)}
          </div>
        </div>
        
        <div className='bg-purple-50 border-2 border-purple-200 rounded-lg p-4 text-center'>
          <div className='text-sm text-gray-600 mb-1'>Días de Pago (DPO)</div>
          <div className='text-3xl font-bold text-purple-600'>
            {displayDiasPago.toFixed(0)} días
          </div>
          <div className='text-xs text-gray-500 mt-2'>
            CxP: {formatCurrency(displayCxP)}
          </div>
        </div>
        
        <div className={`border-2 rounded-lg p-4 text-center ${gapBg}`}>
          <div className='text-sm text-gray-600 mb-1'>GAP (Cobro - Pago)</div>
          <div className={`text-3xl font-bold ${gapColor}`}>
            {displayGap.toFixed(0)} días
          </div>
          <div className='text-xs text-gray-500 mt-2'>
            {gapStatus === 'negativo' ? '⚠️ Riesgo de Liquidez' : gapStatus === 'positivo' ? '✅ Superávit' : '⚖️ Equilibrado'}
          </div>
        </div>
      </div>

      <div className='h-80'>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 13, fill: '#111827', fontWeight: 600 }}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              tickFormatter={(value) => `${value} d`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="rect"
            />
            
            <Bar 
              dataKey="Días Cobro" 
              fill="#3b82f6" 
              radius={[8, 8, 0, 0]}
            />
            
            <Bar 
              dataKey="Días Pago" 
              fill="#a855f7" 
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Fórmulas de Cálculo con valores dinámicos */}
      <div className='mt-6 pt-6 border-t border-gray-200'>
        <h3 className='text-sm font-semibold text-gray-700 mb-4'>📐 Fórmulas de Cálculo</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl'>
          {/* Días de Cobro */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <div className='w-3 h-3 rounded-sm bg-[#3b82f6]'></div>
              <h4 className='font-semibold text-gray-900'>Días de Cobro (DSO)</h4>
            </div>
            <div className='text-sm text-gray-700 space-y-2'>
              <div className='font-mono bg-white px-3 py-2 rounded border border-blue-300'>
                <div className='text-center'>
                  <div className='border-b border-gray-400 pb-1 mb-1 text-blue-600 font-semibold'>
                    {formatCurrency(displayCxC)} × 360
                  </div>
                  <div className='border-b border-gray-400 pb-1 mb-1 text-green-600 font-semibold'>
                    {formatCurrency(displayIngresos)}
                  </div>
                  <div className='mt-1'>= <span className='text-blue-600 font-bold'>{displayDiasCobro.toFixed(2)} días</span></div>
                </div>
              </div>
              <p className='text-xs text-gray-600 mt-2'>
                Tiempo promedio que tarda la empresa en cobrar sus ventas.
              </p>
            </div>
          </div>

          {/* Días de Pago */}
          <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <div className='w-3 h-3 rounded-sm bg-[#a855f7]'></div>
              <h4 className='font-semibold text-gray-900'>Días de Pago (DPO)</h4>
            </div>
            <div className='text-sm text-gray-700 space-y-2'>
              <div className='font-mono bg-white px-3 py-2 rounded border border-purple-300'>
                <div className='text-center'>
                  <div className='border-b border-gray-400 pb-1 mb-1 text-purple-600 font-semibold'>
                    {formatCurrency(displayCxP)} × 360
                  </div>
                  <div className='border-b border-gray-400 pb-1 mb-1 text-orange-600 font-semibold'>
                    {formatCurrency(displayCostoVentas)}
                  </div>
                  <div className='mt-1'>= <span className='text-purple-600 font-bold'>{displayDiasPago.toFixed(2)} días</span></div>
                </div>
              </div>
              <p className='text-xs text-gray-600 mt-2'>
                Tiempo promedio que tarda la empresa en pagar a proveedores.
              </p>
              <p className='text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200 mt-2'>
                ⚠️ Costo de Ventas aproximado: Compras + Variación de Inventario
              </p>
            </div>
          </div>
        </div>

        {/* Interpretación del GAP */}
        <div className='mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-4xl'>
          <p className='font-semibold text-gray-800 mb-3'>💡 Interpretación del GAP:</p>
          <div className='space-y-2 text-sm'>
            <div className='flex items-start gap-2'>
              <span className='text-red-600 font-bold'>❌</span>
              <span className='text-gray-700'>
                <strong>GAP Negativo ({'<'} 0 días):</strong> La empresa paga antes de cobrar, generando necesidad de financiamiento.
              </span>
            </div>
            <div className='flex items-start gap-2'>
              <span className='text-green-600 font-bold'>✅</span>
              <span className='text-gray-700'>
                <strong>GAP Positivo ({'>'} 0 días):</strong> La empresa cobra antes de pagar, generando flujo de caja positivo.
              </span>
            </div>
            <div className='flex items-start gap-2'>
              <span className='text-blue-600 font-bold'>⚖️</span>
              <span className='text-gray-700'>
                <strong>GAP Neutro (≈ 0 días):</strong> Equilibrio entre ciclo de cobro y pago.
              </span>
            </div>
            
            {/* Análisis del caso actual */}
            <div className='mt-4 pt-4 border-t border-gray-300'>
              <p className='font-semibold text-gray-800 mb-2'>📊 Estado Actual:</p>
              <div className={`p-3 rounded-lg ${gapBg} border-2`}>
                <p className={`font-bold ${gapColor} mb-2`}>
                  GAP: {displayGap.toFixed(0)} días ({displayDiasCobro.toFixed(0)} - {displayDiasPago.toFixed(0)})
                </p>
                {gapStatus === 'negativo' && (
                  <div className='text-sm text-gray-700'>
                    <p className='mb-2'>⚠️ <strong>Presión de Liquidez:</strong></p>
                    <ul className='list-disc list-inside space-y-1 ml-2'>
                      <li>Necesita financiar <strong>{Math.abs(displayGap).toFixed(0)} días</strong> de operación</li>
                      <li>Equivale a <strong>{(Math.abs(displayGap) / 30).toFixed(1)} meses</strong> de capital de trabajo</li>
                      <li>Recomendación: Acelerar cobros o negociar plazos de pago más largos</li>
                    </ul>
                  </div>
                )}
                {gapStatus === 'positivo' && (
                  <div className='text-sm text-gray-700'>
                    <p className='mb-2'>✅ <strong>Posición Favorable:</strong></p>
                    <ul className='list-disc list-inside space-y-1 ml-2'>
                      <li>Genera <strong>{displayGap.toFixed(0)} días</strong> de flujo positivo</li>
                      <li>Capital de trabajo liberado</li>
                      <li>Buena gestión del ciclo de conversión de efectivo</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

'use client'

import { useState } from 'react'
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

interface EbitdaChartProps {
  data: Array<{
    date: string
    ebitda: number
    margenEbitda: number
    ingresos: number
    gastos?: number
    gastosOperacionales: number
    gastosFinancieros?: number
    depreciacion: number
    impuestos?: number
    utilidadOperacional: number
  }>
  onHover?: (data: any) => void
}

export function EbitdaChart({ data, onHover }: EbitdaChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const formatSpanishDate = (dateString: string): string => {
    const parts = dateString.split('-')
    
    const month = parseInt(parts[1])
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${months[month - 1]}`
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
          <p className='font-semibold text-gray-900 mb-3'>{data.dateFormatted}</p>
          <div className='space-y-2 text-sm'>
            {/* EBITDA Principal */}
            <div className='pb-2 border-b border-gray-200 bg-blue-50 p-2 rounded'>
              <div className='flex items-center justify-between gap-4'>
                <span className='text-blue-700 font-bold'>EBITDA:</span>
                <span className='font-bold text-blue-800 text-lg'>{formatCurrency(data.ebitda)}</span>
              </div>
              <div className='flex items-center justify-between gap-4 mt-1'>
                <span className='text-blue-600 font-medium'>Margen EBITDA:</span>
                <span className='font-bold text-blue-700'>{data.margenEbitda.toFixed(2)}%</span>
              </div>
            </div>

            {/* Composición del EBITDA */}
            <div className='text-xs text-gray-600 font-semibold pt-1'>Composición:</div>
            <div className='flex items-center justify-between gap-4'>
              <span className='text-gray-700 font-medium'>Utilidad Operacional:</span>
              <span className='font-bold text-gray-800'>{formatCurrency(data.utilidadOperacional)}</span>
            </div>
            <div className='flex items-center justify-between gap-4'>
              <span className='text-gray-600 font-medium'>+ Depreciación:</span>
              <span className='font-bold text-gray-700'>{formatCurrency(data.depreciacion)}</span>
            </div>

            {/* Contexto */}
            <div className='border-t pt-2 mt-2'>
              <div className='flex items-center justify-between gap-4'>
                <span className='text-green-700 font-medium'>Ingresos Totales:</span>
                <span className='font-bold text-green-800'>{formatCurrency(data.ingresos)}</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const handleMouseMove = (state: any) => {
    if (state && state.isTooltipActive && state.activeTooltipIndex !== undefined) {
      const index = state.activeTooltipIndex
      setActiveIndex(index)
      
      if (onHover && chartData[index]) {
        const hoveredData = chartData[index]
        onHover({
          date: hoveredData.date,
          ebitda: hoveredData.ebitda,
          margenEbitda: hoveredData.margenEbitda,
          ingresos: hoveredData.ingresos,
          gastosOperacionales: hoveredData.gastosOperacionales,
          utilidadOperacional: hoveredData.utilidadOperacional,
          depreciacion: hoveredData.depreciacion,
          gastos: hoveredData.gastos || 0,
          gastosFinancieros: hoveredData.gastosFinancieros || 0,
          impuestos: hoveredData.impuestos || 0
        })
      }
    } else {
      setActiveIndex(null)
    }
  }

  const handleMouseLeave = () => {
    setActiveIndex(null)
    if (onHover) {
      onHover(null)
    }
  }

  return (
    <Card title='Evolución del EBITDA' subtitle='Últimos meses'>
      <div className='h-96'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
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
              label={{ value: 'EBITDA ($)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 14, paddingTop: '10px' }}
              iconType='line'
            />
            {/* Línea de EBITDA */}
            <Line
              type='monotone'
              dataKey='ebitda'
              stroke='#3b82f6'
              strokeWidth={3}
              name='EBITDA'
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Nota explicativa */}
      <div className='mt-4 pt-4 border-t border-gray-200'>
        <div className='bg-blue-50 p-3 rounded-lg'>
          <p className='text-xs text-blue-800'>
            <strong>📊 Interpretación:</strong> El gráfico muestra la evolución del <strong>EBITDA</strong> 
            (Earnings Before Interest, Taxes, Depreciation and Amortization) a lo largo del tiempo. 
            El EBITDA representa la capacidad de generar caja operativa del negocio antes de considerar 
            costos financieros, impuestos y depreciación. Una tendencia creciente indica mejora en la 
            rentabilidad operativa y generación de flujo de caja.
          </p>
        </div>
      </div>
    </Card>
  )
}

'use client'

import { useEffect } from 'react'
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card } from '@/components/ui/Card'

interface RoiData {
  date: string
  roi: number
  utilidadNeta: number
  patrimonio: number
  ingresos: number
  gastos: number
  activoTotal: number
  pasivoTotal: number
}

interface RoiChartProps {
  data: RoiData[]
  onHover?: (data: RoiData | null) => void
}

export function RoiChart({ data, onHover }: RoiChartProps) {
  const formatSpanishDate = (dateString: string): string => {
    const [year, month] = dateString.split('-').map(Number)
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return `${months[month - 1]} `
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Preparar datos para el gráfico
  const chartData = data.map(item => ({
    ...item,
    displayDate: formatSpanishDate(item.date)
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    useEffect(() => {
      if (active && payload && payload.length > 0) {
        const dataPoint = data.find(d => d.date === payload[0].payload.date)
        if (dataPoint && onHover) {
          onHover(dataPoint)
        }
      }
    }, [active, payload])

    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className='bg-white p-4 border border-gray-200 rounded-lg shadow-lg'>
          <p className='font-semibold text-gray-900 mb-2'>{data.displayDate}</p>
          <div className='space-y-1'>
            <p className='text-sm'>
              <span className='text-gray-600'>ROI (ROE): </span>
              <span className='font-bold text-green-600'>{data.roi.toFixed(2)}%</span>
            </p>
            <p className='text-sm'>
              <span className='text-gray-600'>Utilidad Neta: </span>
              <span className='font-semibold text-blue-600'>{formatCurrency(data.utilidadNeta)}</span>
            </p>
            <p className='text-sm'>
              <span className='text-gray-600'>Patrimonio: </span>
              <span className='font-semibold text-gray-900'>{formatCurrency(data.patrimonio)}</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card title='Evolución del ROI (ROE)'>
      <div className='h-96'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onMouseLeave={() => {
              if (onHover) {
                onHover(null)
              }
            }}
          >
            <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
            <XAxis
              dataKey='displayDate'
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor='end'
              height={80}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type='monotone'
              dataKey='roi'
              stroke='#059669'
              strokeWidth={3}
              dot={{ fill: '#059669', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

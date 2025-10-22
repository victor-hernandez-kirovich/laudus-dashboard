'use client'

import { Card } from '@/components/ui/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface CurrentRatioChartProps {
  data: {
    date: string
    ratio: number
    activos: number
    pasivos: number
  }[]
}

export function CurrentRatioChart({ data }: CurrentRatioChartProps) {
  const formatSpanishDate = (dateString: string): string => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.getMonth() + 1
    return `${day}/${month}`
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
    ratio: parseFloat(item.ratio.toFixed(2)),
    activos: item.activos,
    pasivos: item.pasivos
  })).reverse() // Invertir para mostrar cronológicamente

  return (
    <Card title="Evolución del Current Ratio" subtitle={`Últimos ${data.length} registros`}>
      <div className='h-80'>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
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
              formatter={(value: any, name: string) => {
                if (name === 'ratio') {
                  return [value.toFixed(2), 'Current Ratio']
                }
                if (name === 'activos') {
                  return [formatCurrency(value), 'Activos Corrientes']
                }
                if (name === 'pasivos') {
                  return [formatCurrency(value), 'Pasivos Corrientes']
                }
                return [value, name]
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
            />
            
            {/* Línea de referencia en 1.5 (umbral saludable) */}
            <ReferenceLine 
              y={1.5} 
              stroke="#10b981" 
              strokeDasharray="5 5"
              label={{ value: 'Saludable (1.5)', position: 'right', fill: '#10b981', fontSize: 12 }}
            />
            
            {/* Línea de referencia en 1.0 (umbral mínimo) */}
            <ReferenceLine 
              y={1.0} 
              stroke="#f59e0b" 
              strokeDasharray="5 5"
              label={{ value: 'Mínimo (1.0)', position: 'right', fill: '#f59e0b', fontSize: 12 }}
            />
            
            <Line 
              type="monotone" 
              dataKey="ratio" 
              stroke="#2563eb" 
              strokeWidth={3}
              dot={{ fill: '#2563eb', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

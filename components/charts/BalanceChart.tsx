'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Card } from '../ui/Card';

interface BalanceChartProps {
  data: any[];
  title: string;
  subtitle?: string;
}

export function BalanceChart({ data, title, subtitle }: BalanceChartProps) {
  // Transform data for chart
  const chartData = data.slice(0, 10).map(item => ({
    name: item.accountName || item.accountCode || 'N/A',
    balance: Math.abs(item.balance || 0),
    debit: item.debit || 0,
    credit: item.credit || 0,
  }));

  return (
    <Card title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={120}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip 
            formatter={(value: any) => formatCurrency(value)}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar dataKey="debit" fill="#3b82f6" name="Debe" />
          <Bar dataKey="credit" fill="#10b981" name="Haber" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

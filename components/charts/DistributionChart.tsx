'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Card } from '../ui/Card';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface DistributionChartProps {
  data: any[];
  title: string;
  subtitle?: string;
}

export function DistributionChart({ data, title, subtitle }: DistributionChartProps) {
  // Validar que data sea un array válido
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card title={title} subtitle={subtitle}>
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">📊</div>
            <p className="text-gray-500 font-medium">No hay datos disponibles</p>
            <p className="text-gray-400 text-sm mt-1">
              No se encontraron registros para mostrar en el gráfico
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Procesar y filtrar datos - soportar múltiples nombres de campo
  const chartData = data
    .slice(0, 6)
    .map((item, index) => {
      // Obtener el nombre de la cuenta
      const name = item.accountName || item.accountCode || item.name || `Cuenta ${index + 1}`;
      
      // Obtener el valor - soportar múltiples nombres de campo
      const rawValue = item.balance ?? item.amount ?? item.value ?? item.total ?? 0;
      const value = Math.abs(Number(rawValue));
      
      return {
        name: name.length > 30 ? name.substring(0, 27) + '...' : name,
        fullName: name,
        value: value,
      };
    })
    .filter(item => item.value > 0); // Filtrar valores cero o negativos

  // Si después de filtrar no hay datos válidos
  if (chartData.length === 0) {
    return (
      <Card title={title} subtitle={subtitle}>
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">💰</div>
            <p className="text-gray-500 font-medium">Sin valores para mostrar</p>
            <p className="text-gray-400 text-sm mt-1">
              Todos los valores de balance son cero
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Renderizar gráfico con datos válidos
  return (
    <Card title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry: any) => {
              // Label más corto para el gráfico
              const shortName = entry.name.length > 15 
                ? entry.name.substring(0, 12) + '...' 
                : entry.name;
              return `${shortName}: ${formatCurrency(entry.value)}`;
            }}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => formatCurrency(value)}
            labelFormatter={(label: any) => {
              // Mostrar nombre completo en tooltip
              const item = chartData.find(d => d.name === label);
              return item?.fullName || label;
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Mostrar cantidad de registros válidos */}
      <div className="mt-2 text-center text-xs text-gray-500">
        Mostrando {chartData.length} cuenta{chartData.length !== 1 ? 's' : ''} con valores
      </div>
    </Card>
  );
}

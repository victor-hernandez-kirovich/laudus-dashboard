"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface DataPoint {
  month: string;
  monthName: string;
  ventasBrutas: number;
  ventasNetas: number;
}

interface VentasBrutasVsNetasChartProps {
  data: DataPoint[];
  selectedYear: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const ventasBrutas = payload.find((p: any) => p.dataKey === "ventasBrutas");
    const ventasNetas = payload.find((p: any) => p.dataKey === "ventasNetas");
    
    const bruto = ventasBrutas?.value || 0;
    const neto = ventasNetas?.value || 0;
    const diferencia = bruto - neto;
    const porcentajeDiferencia = bruto > 0 ? ((diferencia / bruto) * 100).toFixed(2) : "0.00";

    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-bold text-gray-900 mb-2 border-b pb-2">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">Ventas Brutas:</span>
            <span className="text-sm font-semibold text-green-600">
              {formatCurrency(bruto)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-600">Ventas Netas:</span>
            <span className="text-sm font-semibold text-blue-600">
              {formatCurrency(neto)}
            </span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className="text-sm text-gray-600">Devoluciones:</span>
              <span className="text-sm font-semibold text-red-500">
                {formatCurrency(diferencia)} ({porcentajeDiferencia}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function VentasBrutasVsNetasChart({ data, selectedYear }: VentasBrutasVsNetasChartProps) {
  // Calcular el máximo para el eje Y
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.ventasBrutas, d.ventasNetas))
  );
  const yAxisMax = Math.ceil(maxValue / 10000000) * 10000000; // Redondear al siguiente múltiplo de 10M

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="monthName"
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickLine={{ stroke: "#d1d5db" }}
            axisLine={{ stroke: "#d1d5db" }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={{ stroke: "#d1d5db" }}
            axisLine={{ stroke: "#d1d5db" }}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
            domain={[0, yAxisMax]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => (
              <span className="text-sm font-medium text-gray-700">{value}</span>
            )}
          />
          <Line
            type="monotone"
            dataKey="ventasBrutas"
            name="Ventas Brutas"
            stroke="#22c55e"
            strokeWidth={3}
            dot={{ fill: "#22c55e", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 8, fill: "#16a34a" }}
          />
          <Line
            type="monotone"
            dataKey="ventasNetas"
            name="Ventas Netas"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 8, fill: "#2563eb" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

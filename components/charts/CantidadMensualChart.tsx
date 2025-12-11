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

interface DataPoint {
  month: string;
  monthName: string;
  cantidad: number;
}

interface CantidadMensualChartProps {
  data: DataPoint[];
  selectedYear: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const cantidad = payload[0]?.value || 0;

    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-bold text-gray-900 mb-2 border-b pb-2">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span className="text-sm text-gray-600">Cantidad:</span>
            <span className="text-sm font-semibold text-indigo-600">
              {cantidad.toLocaleString("es-CL")} unidades
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function CantidadMensualChart({ data, selectedYear }: CantidadMensualChartProps) {
  // Calcular el máximo para el eje Y
  const maxValue = Math.max(...data.map((d) => d.cantidad));
  const yAxisMax = Math.ceil(maxValue / 1000) * 1000; // Redondear al siguiente múltiplo de 1000

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
            tickFormatter={(value) => value.toLocaleString("es-CL")}
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
            dataKey="cantidad"
            name="Cantidad de Facturas"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ fill: "#6366f1", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 8, fill: "#4f46e5" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

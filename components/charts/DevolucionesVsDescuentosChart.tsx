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
  devoluciones: number;
  descuentos: number;
  devolucionesPct: number;
  descuentosPct: number;
}

interface DevolucionesVsDescuentosChartProps {
  data: DataPoint[];
  selectedYear: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const devoluciones = payload.find((p: any) => p.dataKey === "devoluciones");
    const descuentos = payload.find((p: any) => p.dataKey === "descuentos");
    
    const devValue = devoluciones?.value || 0;
    const descValue = descuentos?.value || 0;
    const devPct = payload[0]?.payload?.devolucionesPct || 0;
    const descPct = payload[0]?.payload?.descuentosPct || 0;

    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-bold text-gray-900 mb-2 border-b pb-2">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600">Devoluciones:</span>
            <span className="text-sm font-semibold text-red-600">
              {formatCurrency(devValue)} ({devPct.toFixed(2)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-sm text-gray-600">Descuentos:</span>
            <span className="text-sm font-semibold text-orange-600">
              {formatCurrency(descValue)} ({descPct.toFixed(2)}%)
            </span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-600">Total Deducciones:</span>
              <span className="text-sm font-semibold text-purple-600">
                {formatCurrency(devValue + descValue)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function DevolucionesVsDescuentosChart({ data, selectedYear }: DevolucionesVsDescuentosChartProps) {
  // Calcular el máximo para el eje Y
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.devoluciones, d.descuentos))
  );
  const yAxisMax = Math.ceil(maxValue / 1000000) * 1000000; // Redondear al siguiente múltiplo de 1M

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
            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
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
            dataKey="devoluciones"
            name="Devoluciones"
            stroke="#ef4444"
            strokeWidth={3}
            dot={{ fill: "#ef4444", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 8, fill: "#dc2626" }}
          />
          <Line
            type="monotone"
            dataKey="descuentos"
            name="Descuentos"
            stroke="#f97316"
            strokeWidth={3}
            dot={{ fill: "#f97316", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 8, fill: "#ea580c" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

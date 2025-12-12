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
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface DataPoint {
  month: string;
  monthName: string;
  flujoOperacion: number;
  flujoInversion: number;
  flujoFinanciamiento: number;
  saldoEfectivoFinal: number;
}

interface FlujoCajaProyectadoChartProps {
  data: DataPoint[];
  selectedYear: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const flujoOperacion = payload.find((p: any) => p.dataKey === "flujoOperacion")?.value || 0;
    const flujoInversion = payload.find((p: any) => p.dataKey === "flujoInversion")?.value || 0;
    const flujoFinanciamiento = payload.find((p: any) => p.dataKey === "flujoFinanciamiento")?.value || 0;
    const saldoEfectivoFinal = payload.find((p: any) => p.dataKey === "saldoEfectivoFinal")?.value || 0;

    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-bold text-gray-900 mb-3 border-b pb-2">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">Flujo de Operación:</span>
            <span className={`text-sm font-semibold ${flujoOperacion >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(flujoOperacion)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600">Flujo de Inversión:</span>
            <span className={`text-sm font-semibold ${flujoInversion >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(flujoInversion)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-sm text-gray-600">Flujo de Financiamiento:</span>
            <span className={`text-sm font-semibold ${flujoFinanciamiento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(flujoFinanciamiento)}
            </span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600 font-medium">Saldo Efectivo Final:</span>
              <span className={`text-sm font-bold ${saldoEfectivoFinal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(saldoEfectivoFinal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function FlujoCajaProyectadoChart({ data, selectedYear }: FlujoCajaProyectadoChartProps) {
  // Calcular el rango para el eje Y (incluyendo valores negativos)
  const allValues = data.flatMap((d) => [
    d.flujoOperacion,
    d.flujoInversion,
    d.flujoFinanciamiento,
    d.saldoEfectivoFinal,
  ]);
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  
  // Agregar padding del 20% para que no se vea aplanado
  const range = maxValue - minValue;
  const padding = range * 0.2;
  const yAxisMax = Math.ceil((maxValue + padding) / 10000000) * 10000000;
  const yAxisMin = Math.floor((minValue - padding) / 10000000) * 10000000;

  return (
    <div className="w-full h-[700px]">
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
            domain={[yAxisMin, yAxisMax]}
          />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => (
              <span className="text-sm font-medium text-gray-700">{value}</span>
            )}
          />
          <Line
            type="monotone"
            dataKey="flujoOperacion"
            name="Flujo de Operación"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 7, fill: "#16a34a" }}
          />
          <Line
            type="monotone"
            dataKey="flujoInversion"
            name="Flujo de Inversión"
            stroke="#ef4444"
            strokeWidth={2.5}
            dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 7, fill: "#dc2626" }}
          />
          <Line
            type="monotone"
            dataKey="flujoFinanciamiento"
            name="Flujo de Financiamiento"
            stroke="#f97316"
            strokeWidth={2.5}
            dot={{ fill: "#f97316", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 7, fill: "#ea580c" }}
          />
          <Line
            type="monotone"
            dataKey="saldoEfectivoFinal"
            name="Saldo Efectivo Final"
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

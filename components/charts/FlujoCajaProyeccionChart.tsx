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

interface ProjectionDataPoint {
  month: string;
  flujoOperacion: number;
  flujoInversion: number;
  flujoFinanciamiento: number;
  saldoEfectivoFinal: number;
  // Valores del año anterior para comparación
  flujoOperacionPrev?: number;
  flujoInversionPrev?: number;
  flujoFinanciamientoPrev?: number;
  saldoEfectivoFinalPrev?: number;
}

interface FlujoCajaProyeccionChartProps {
  data: ProjectionDataPoint[] | null;
  projectionYear: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const flujoOperacion = payload.find((p: any) => p.dataKey === "flujoOperacion")?.value || 0;
    const flujoInversion = payload.find((p: any) => p.dataKey === "flujoInversion")?.value || 0;
    const flujoFinanciamiento = payload.find((p: any) => p.dataKey === "flujoFinanciamiento")?.value || 0;
    const saldoEfectivoFinal = payload.find((p: any) => p.dataKey === "saldoEfectivoFinal")?.value || 0;

    const dataPoint = payload[0]?.payload;
    const flujoOperacionPrev = dataPoint?.flujoOperacionPrev || 0;
    const flujoInversionPrev = dataPoint?.flujoInversionPrev || 0;
    const flujoFinanciamientoPrev = dataPoint?.flujoFinanciamientoPrev || 0;
    const saldoEfectivoFinalPrev = dataPoint?.saldoEfectivoFinalPrev || 0;

    const calcChange = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : current < 0 ? -100 : 0;
      return ((current - prev) / Math.abs(prev)) * 100;
    };

    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-sm">
        <p className="font-bold text-gray-900 mb-3 border-b pb-2">{label} (Proyección)</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">Flujo Operación:</span>
            </div>
            <div className="text-right">
              <span className={`font-semibold ${flujoOperacion >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(flujoOperacion)}
              </span>
              <span className={`text-xs ml-1 ${calcChange(flujoOperacion, flujoOperacionPrev) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ({calcChange(flujoOperacion, flujoOperacionPrev) >= 0 ? '+' : ''}{calcChange(flujoOperacion, flujoOperacionPrev).toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600">Flujo Inversión:</span>
            </div>
            <div className="text-right">
              <span className={`font-semibold ${flujoInversion >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(flujoInversion)}
              </span>
              <span className={`text-xs ml-1 ${calcChange(flujoInversion, flujoInversionPrev) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ({calcChange(flujoInversion, flujoInversionPrev) >= 0 ? '+' : ''}{calcChange(flujoInversion, flujoInversionPrev).toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-gray-600">Flujo Financiamiento:</span>
            </div>
            <div className="text-right">
              <span className={`font-semibold ${flujoFinanciamiento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(flujoFinanciamiento)}
              </span>
              <span className={`text-xs ml-1 ${calcChange(flujoFinanciamiento, flujoFinanciamientoPrev) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ({calcChange(flujoFinanciamiento, flujoFinanciamientoPrev) >= 0 ? '+' : ''}{calcChange(flujoFinanciamiento, flujoFinanciamientoPrev).toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600 font-medium">Saldo Final:</span>
              </div>
              <div className="text-right">
                <span className={`font-bold ${saldoEfectivoFinal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(saldoEfectivoFinal)}
                </span>
                <span className={`text-xs ml-1 ${calcChange(saldoEfectivoFinal, saldoEfectivoFinalPrev) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ({calcChange(saldoEfectivoFinal, saldoEfectivoFinalPrev) >= 0 ? '+' : ''}{calcChange(saldoEfectivoFinal, saldoEfectivoFinalPrev).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2 italic">% vs año anterior</p>
      </div>
    );
  }
  return null;
};

export function FlujoCajaProyeccionChart({ data, projectionYear }: FlujoCajaProyeccionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[700px] flex items-center justify-center">
        <div className="text-gray-500">No hay datos suficientes para la proyección</div>
      </div>
    );
  }

  // Calcular el rango para el eje Y (incluyendo valores negativos)
  const allValues = data.flatMap((d) => [
    d.flujoOperacion,
    d.flujoInversion,
    d.flujoFinanciamiento,
    d.saldoEfectivoFinal,
  ]);
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  
  // Agregar padding del 20% para mejor visualización
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
            dataKey="month"
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
            name="Flujo de Operación (Proyección)"
            stroke="#22c55e"
            strokeWidth={2.5}
            strokeDasharray="8 4"
            dot={{ fill: "#22c55e", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 8, fill: "#16a34a" }}
          />
          <Line
            type="monotone"
            dataKey="flujoInversion"
            name="Flujo de Inversión (Proyección)"
            stroke="#ef4444"
            strokeWidth={2.5}
            strokeDasharray="8 4"
            dot={{ fill: "#ef4444", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 8, fill: "#dc2626" }}
          />
          <Line
            type="monotone"
            dataKey="flujoFinanciamiento"
            name="Flujo de Financiamiento (Proyección)"
            stroke="#f97316"
            strokeWidth={2.5}
            strokeDasharray="8 4"
            dot={{ fill: "#f97316", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 8, fill: "#ea580c" }}
          />
          <Line
            type="monotone"
            dataKey="saldoEfectivoFinal"
            name="Saldo Efectivo Final (Proyección)"
            stroke="#3b82f6"
            strokeWidth={3}
            strokeDasharray="8 4"
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 6 }}
            activeDot={{ r: 9, fill: "#2563eb" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Función para calcular regresión lineal
export function calculateLinearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: values[0] };

  // X values: 1, 2, 3, ... n (años)
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = i + 1;
    const y = values[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

// Función para proyectar el siguiente valor
export function projectNextValue(values: number[]): number {
  const { slope, intercept } = calculateLinearRegression(values);
  const nextX = values.length + 1;
  return slope * nextX + intercept;
}

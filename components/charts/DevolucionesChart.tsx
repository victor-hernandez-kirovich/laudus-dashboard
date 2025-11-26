"use client";

import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface MonthlyReturnsData {
  month: string;
  monthName: string;
  returns: number;
  returnsPercentage: number;
}

interface DevolucionesChartProps {
  data: MonthlyReturnsData[];
  year: number;
}

export function DevolucionesChart({ data, year }: DevolucionesChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{entry.name}:</span>
              <span className="text-sm font-semibold text-gray-900">
                {entry.dataKey === "returns"
                  ? formatCurrency(entry.value)
                  : `${entry.value.toFixed(2)}%`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="monthName"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            yAxisId="left"
            stroke="#ef4444"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) =>
              `$${(value / 1000000).toFixed(1)}M`
            }
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#f97316"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => `${value.toFixed(1)}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "14px" }}
          />
          <Bar
            yAxisId="left"
            dataKey="returns"
            name="Monto de Devoluciones"
            fill="#ef4444"
            radius={[8, 8, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="returnsPercentage"
            name="% de Devoluciones"
            stroke="#f97316"
            strokeWidth={3}
            dot={{ fill: "#f97316", r: 5 }}
            activeDot={{ r: 7 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

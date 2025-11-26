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

interface MonthlyMarginData {
  month: string;
  monthName: string;
  margen: number;
  margenPercentage: number;
}

interface MargenMensualChartProps {
  data: MonthlyMarginData[];
  year: number;
}

export function MargenMensualChart({ data, year }: MargenMensualChartProps) {
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
                {entry.dataKey === "margen"
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
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="monthName"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            yAxisId="left"
            stroke="#8b5cf6"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) =>
              `$${(value / 1000000).toFixed(1)}M`
            }
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#10b981"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "14px" }}
            iconType="line"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="margen"
            name="Monto de Margen"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={{ fill: "#8b5cf6", r: 5 }}
            activeDot={{ r: 7 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="margenPercentage"
            name="% de Margen"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: "#10b981", r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

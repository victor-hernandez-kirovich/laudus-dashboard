"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface MonthlyData {
  monthName: string;
  monthNumber: number;
  net: number;
  margin: number;
  marginPercentage: number;
  numberOfDocuments: number;
  averageTicket: number;
}

interface SalesmanMonthlyPerformanceChartProps {
  data: MonthlyData[];
  salesmanName: string;
}

export function SalesmanMonthlyPerformanceChart({
  data,
  salesmanName,
}: SalesmanMonthlyPerformanceChartProps) {
  // Sort data by month number
  const sortedData = [...data].sort((a, b) => a.monthNumber - b.monthNumber);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{data.monthName}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">Ventas Netas:</span>
              <span className="text-sm font-semibold text-purple-600">
                {formatCurrency(data.net)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">Margen:</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(data.margin)} ({data.marginPercentage.toFixed(2)}%)
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">Documentos:</span>
              <span className="text-sm font-semibold text-gray-900">
                {data.numberOfDocuments.toLocaleString("es-CL")}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">Ticket Promedio:</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(data.averageTicket)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="monthName"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="rect"
            formatter={(value) => (
              <span className="text-sm text-gray-700">{value}</span>
            )}
          />
          <Bar
            dataKey="net"
            name="Ventas Netas"
            fill="#7c3aed"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

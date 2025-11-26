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
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface SalesmanRankingData {
  salesmanName: string;
  net: number;
  margin: number;
  marginPercentage: number;
  numberOfDocuments: number;
  averageTicket: number;
}

interface TopVendedoresChartProps {
  data: SalesmanRankingData[];
  topN?: number;
}

export function TopVendedoresChart({ data, topN = 10 }: TopVendedoresChartProps) {
  const topSalesmen = data.slice(0, topN);

  // Gradiente de colores: del más oscuro (top 1) al más claro (top 10)
  // Todos los colores son claramente visibles
  const getBarColor = (index: number) => {
    const colors = [
      "#7c3aed", // violet-600 - Top 1 (más oscuro)
      "#8b5cf6", // violet-500 - Top 2
      "#9333ea", // purple-600 - Top 3
      "#a855f7", // purple-500 - Top 4
      "#a78bfa", // violet-400 - Top 5
      "#b085f5", // violet-450 - Top 6
      "#c084fc", // purple-400 - Top 7
      "#c4b5fd", // violet-300 - Top 8
      "#d8b4fe", // purple-300 - Top 9
      "#ddd6fe", // violet-200 - Top 10
    ];
    return colors[index] || "#a78bfa";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{data.salesmanName}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">Ventas Netas:</span>
              <span className="text-sm font-semibold text-gray-900">
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
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={topSalesmen}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
          />
          <YAxis
            type="category"
            dataKey="salesmanName"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            width={140}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="net" name="Ventas Netas" radius={[0, 8, 8, 0]}>
            {topSalesmen.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

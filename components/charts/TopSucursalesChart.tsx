"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface MonthlyStackedData {
  month: string;
  monthName: string;
  [key: string]: number | string;
}

interface BranchInfo {
  name: string;
  color: string;
}

interface TopSucursalesChartProps {
  data: MonthlyStackedData[];
  branches: BranchInfo[];
}

export function TopSucursalesChart({ data, branches }: TopSucursalesChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Calculate total for the month
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Total del mes:</span>
            <span className="text-sm font-bold text-gray-900">
              {formatCurrency(total)}
            </span>
          </div>
          {payload.reverse().map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-gray-600">{entry.name}:</span>
              <span className="text-xs font-semibold text-gray-900">
                {formatCurrency(entry.value)}
              </span>
              <span className="text-xs text-gray-500">
                ({((entry.value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="monthName"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            iconType="square"
          />
          {branches.map((branch) => (
            <Bar
              key={branch.name}
              dataKey={branch.name}
              name={branch.name}
              fill={branch.color}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

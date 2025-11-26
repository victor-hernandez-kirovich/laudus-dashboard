"use client";

import React, { useState } from "react";
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

interface MonthlyBranchData {
  month: string;
  monthName: string;
  [key: string]: number | string;
}

interface BranchInfo {
  name: string;
  color: string;
}

interface EvolucionSucursalesChartProps {
  data: MonthlyBranchData[];
  branches: BranchInfo[];
  defaultSelected?: string[];
}

export function EvolucionSucursalesChart({
  data,
  branches,
  defaultSelected = [],
}: EvolucionSucursalesChartProps) {
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(
    new Set(defaultSelected.length > 0 ? defaultSelected : branches.slice(0, 5).map((b) => b.name))
  );

  const toggleBranch = (branchName: string) => {
    const newSelected = new Set(selectedBranches);
    if (newSelected.has(branchName)) {
      newSelected.delete(branchName);
    } else {
      newSelected.add(branchName);
    }
    setSelectedBranches(newSelected);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Calculate total for the month
      const monthData = data.find((d) => d.monthName === label);
      let total = 0;
      if (monthData) {
        branches.forEach((branch) => {
          const value = monthData[branch.name];
          if (typeof value === "number") {
            total += value;
          }
        });
      }

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
            <span className="text-xs text-gray-600">Total del mes:</span>
            <span className="text-xs font-bold text-gray-900">
              {formatCurrency(total)}
            </span>
          </div>
          {payload.map((entry: any, index: number) => {
            const percentage = total > 0 ? (entry.value / total) * 100 : 0;
            return (
              <div key={index} className="flex items-center gap-2 mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600">{entry.name}:</span>
                <span className="text-xs font-semibold text-gray-900">
                  {percentage.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">
                  ({formatCurrency(entry.value)})
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Branch Selector */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700 mr-2">
          Seleccionar sucursales:
        </span>
        {branches.map((branch) => (
          <button
            key={branch.name}
            onClick={() => toggleBranch(branch.name)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              selectedBranches.has(branch.name)
                ? "text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={{
              backgroundColor: selectedBranches.has(branch.name)
                ? branch.color
                : undefined,
            }}
          >
            {branch.name}
          </button>
        ))}
      </div>

      {/* Chart */}
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
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
              tickFormatter={(value) => `${value.toFixed(0)}%`}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              iconType="line"
            />
            {branches
              .filter((branch) => selectedBranches.has(branch.name))
              .map((branch) => (
                <Line
                  key={branch.name}
                  type="monotone"
                  dataKey={branch.name}
                  name={branch.name}
                  stroke={branch.color}
                  strokeWidth={2}
                  dot={{ fill: branch.color, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

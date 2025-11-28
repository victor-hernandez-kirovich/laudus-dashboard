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

interface BranchNetMarginData {
  branch: string;
  net: number;
  margin: number;
  marginPercentage: number;
}

interface BranchNetMarginChartProps {
  data: BranchNetMarginData[];
}

export function BranchNetMarginChart({ data }: BranchNetMarginChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const netData = payload.find((p: any) => p.dataKey === "net");
      const marginData = payload.find((p: any) => p.dataKey === "margin");
      const branchData = data.find((d) => d.branch === label);

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            {netData && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: netData.fill }}
                  />
                  <span className="text-sm text-gray-600">Ventas Netas:</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(netData.value)}
                </span>
              </div>
            )}
            {marginData && branchData && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: marginData.fill }}
                  />
                  <span className="text-sm text-gray-600">Margen:</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(marginData.value)} ({branchData.marginPercentage.toFixed(2)}%)
                </span>
              </div>
            )}
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
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="branch"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            angle={-45}
            textAnchor="end"
            height={100}
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
            fill="#10b981"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="margin"
            name="Margen"
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

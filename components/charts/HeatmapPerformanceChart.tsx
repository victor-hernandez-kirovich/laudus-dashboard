"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";

interface HeatmapData {
  branch: string;
  months: {
    [monthNumber: number]: number;
  };
  maxValue: number;
}

interface HeatmapPerformanceChartProps {
  data: HeatmapData[];
  year: number;
}

export function HeatmapPerformanceChart({ data, year }: HeatmapPerformanceChartProps) {
  const monthNames = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  // Find global max for color scaling
  const globalMax = Math.max(...data.map((d) => d.maxValue));

  const getColor = (value: number, max: number) => {
    if (value === 0) return "#f3f4f6"; // gray-100
    const intensity = value / max;
    
    if (intensity >= 0.8) return "#065f46"; // green-900
    if (intensity >= 0.6) return "#047857"; // green-700
    if (intensity >= 0.4) return "#10b981"; // green-500
    if (intensity >= 0.2) return "#6ee7b7"; // green-300
    return "#d1fae5"; // green-100
  };

  const getTextColor = (value: number, max: number) => {
    if (value === 0) return "#9ca3af"; // gray-400
    const intensity = value / max;
    return intensity >= 0.5 ? "#ffffff" : "#1f2937"; // white or gray-800
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Header */}
        <div className="grid grid-cols-13 gap-1 mb-2">
          <div className="font-semibold text-sm text-gray-700 flex items-center">
            Sucursal
          </div>
          {monthNames.map((month, index) => (
            <div
              key={index}
              className="text-center font-semibold text-xs text-gray-700"
            >
              {month}
            </div>
          ))}
        </div>

        {/* Heatmap Rows */}
        <div className="space-y-1">
          {data.map((branch) => (
            <div key={branch.branch} className="grid grid-cols-13 gap-1">
              <div className="font-medium text-xs text-gray-900 flex items-center pr-2">
                {branch.branch}
              </div>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((monthNum) => {
                const value = branch.months[monthNum] || 0;
                const bgColor = getColor(value, globalMax);
                const textColor = getTextColor(value, globalMax);
                return (
                  <div
                    key={monthNum}
                    className="relative group h-12 rounded flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                    style={{ backgroundColor: bgColor }}
                  >
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: textColor }}
                    >
                      {value > 0 ? `${(value / 1000000).toFixed(1)}M` : "-"}
                    </span>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                        <div className="font-semibold">{branch.branch}</div>
                        <div>{monthNames[monthNum - 1]}</div>
                        <div>{formatCurrency(value)}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                          <div className="border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-xs text-gray-600">Intensidad de ventas:</span>
          <div className="flex gap-1">
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 rounded" style={{ backgroundColor: "#d1fae5" }}></div>
              <span className="text-xs text-gray-600">Bajo</span>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <div className="w-6 h-4 rounded" style={{ backgroundColor: "#10b981" }}></div>
              <span className="text-xs text-gray-600">Medio</span>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <div className="w-6 h-4 rounded" style={{ backgroundColor: "#065f46" }}></div>
              <span className="text-xs text-gray-600">Alto</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .grid-cols-13 {
          display: grid;
          grid-template-columns: 120px repeat(12, 1fr);
        }
      `}</style>
    </div>
  );
}

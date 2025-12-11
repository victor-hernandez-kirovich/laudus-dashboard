"use client";

import React, { useMemo } from "react";
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

interface MonthlyStackedData {
  month: string;
  monthName: string;
  [key: string]: number | string;
}

interface BranchInfo {
  name: string;
  color: string;
}

interface BranchCombinedChartProps {
  data: MonthlyStackedData[];
  branches: BranchInfo[];
}

export function BranchCombinedChart({ data, branches }: BranchCombinedChartProps) {
  // Calcular el total mensual para la línea de tendencia
  const dataWithTotal = useMemo(() => {
    return data.map(month => {
      const total = branches.reduce((sum, branch) => {
        return sum + (Number(month[branch.name]) || 0);
      }, 0);
      return { ...month, totalMensual: total };
    });
  }, [data, branches]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Obtener nombres de sucursales para filtrar
      const branchNames = new Set(branches.map(b => b.name));
      
      // Usar un Map para obtener solo UNA entrada por sucursal (evitar duplicados barra+línea)
      const uniqueEntries = new Map<string, any>();
      payload.forEach((entry: any) => {
        // Solo agregar si es una sucursal y no está ya en el Map
        if (branchNames.has(entry.dataKey) && !uniqueEntries.has(entry.dataKey)) {
          uniqueEntries.set(entry.dataKey, entry);
        }
      });
      
      // Convertir a array
      const branchEntries = Array.from(uniqueEntries.values());
      
      // Calcular el total sumando las ventas de cada sucursal (sin duplicados)
      const totalMes = branchEntries.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
      
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          
          {/* Total del mes (suma de todas las sucursales) */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-gray-300">
            <div className="w-3 h-3 rounded-full bg-gray-800" />
            <span className="text-sm font-semibold text-gray-700">Total del mes:</span>
            <span className="text-sm font-bold text-gray-900">
              {formatCurrency(totalMes)}
            </span>
          </div>
          
          {/* Detalle por sucursal */}
          <p className="text-xs text-gray-500 mb-2 font-medium">Detalle por sucursal:</p>
          {branchEntries
            .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
            .map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2 mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600">{entry.name}:</span>
                <span className="text-xs font-semibold text-gray-900">
                  {formatCurrency(entry.value)}
                </span>
                {totalMes > 0 && (
                  <span className="text-xs text-gray-500">
                    ({((entry.value / totalMes) * 100).toFixed(1)}%)
                  </span>
                )}
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
        <ComposedChart
          data={dataWithTotal}
          margin={{ top: 20, right: 60, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="monthName"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
          />
          {/* Eje Y izquierdo para barras (sucursales individuales) */}
          <YAxis
            yAxisId="left"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
            domain={[0, 150000000]}
          />
         
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
            iconType="square"
          />
          
          {/* Barras agrupadas (lado a lado) */}
          {branches.map((branch) => (
            <Bar
              key={`bar-${branch.name}`}
              dataKey={branch.name}
              name={branch.name}
              fill={branch.color}
              yAxisId="left"
            />
          ))}
          
          {/* Líneas de tendencia por sucursal */}
          {branches.map((branch) => (
            <Line
              key={`line-${branch.name}`}
              type="monotone"
              dataKey={branch.name}
              name={branch.name}
              stroke={branch.color}
              strokeWidth={2}
              dot={{ r: 4, fill: branch.color, strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, fill: branch.color, strokeWidth: 2, stroke: "#fff" }}
              legendType="none"
              yAxisId="left"
            />
          ))}
          
          {/* Línea de TOTAL mensual */}
          <Line
            type="monotone"
            dataKey="totalMensual"
            name="Total Mensual"
            stroke="#1f2937"
            strokeWidth={3}
            dot={{ r: 5, fill: "#1f2937", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 7, fill: "#1f2937", strokeWidth: 2, stroke: "#fff" }}
            yAxisId="right"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

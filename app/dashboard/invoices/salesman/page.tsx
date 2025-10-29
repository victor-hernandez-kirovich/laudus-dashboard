"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { InvoicesBySalesmanData } from "@/lib/types";

export default function InvoicesBySalesmanPage() {
  const [salesmen, setSalesmen] = useState<InvoicesBySalesmanData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [selectedMonthNumber, setSelectedMonthNumber] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compute available years from salesmen
  const availableYears = Array.from(
    new Set(salesmen.map((s) => s.year))
  ).sort((a, b) => b - a);

  // Compute available months for selected year (unique by monthNumber)
  const availableMonths = Array.from(
    salesmen
      .filter((s) => s.year === selectedYear)
      .reduce((map, s) => {
        if (!map.has(s.monthNumber)) {
          map.set(s.monthNumber, { monthNumber: s.monthNumber, monthName: s.monthName });
        }
        return map;
      }, new Map<number, { monthNumber: number; monthName: string }>())
      .values()
  ).sort((a, b) => b.monthNumber - a.monthNumber);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/data/invoices/salesman");
        if (!res.ok) throw new Error("Error al cargar datos");
        const result = await res.json();
        setSalesmen(result.data);
        // Seleccionar el mes más reciente por defecto
        if (result.data && result.data.length > 0) {
          const mostRecent = result.data[0];
          setSelectedYear(mostRecent.year);
          setSelectedMonthNumber(mostRecent.monthNumber);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // When year changes, select the first available month
  useEffect(() => {
    if (selectedYear && salesmen.length > 0) {
      const monthsForYear = Array.from(
        new Set(
          salesmen
            .filter((s) => s.year === selectedYear)
            .map((s) => s.monthNumber)
        )
      ).sort((a, b) => b - a);
      if (monthsForYear.length > 0 && selectedMonthNumber === 0) {
        setSelectedMonthNumber(monthsForYear[0]);
      }
    }
  }, [selectedYear, salesmen, selectedMonthNumber]);

  if (loading) {
    return (
      <div>
        <Header
          title="Facturas por Vendedor"
          subtitle="Reporte de ventas por vendedor"
        />
        <div className="p-8 flex items-center justify-center">
          <div className="text-gray-600">Cargando datos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header
          title="Facturas por Vendedor"
          subtitle="Reporte de ventas por vendedor"
        />
        <div className="p-8">
          <Card>
            <div className="text-red-600">Error: {error}</div>
          </Card>
        </div>
      </div>
    );
  }

  if (!salesmen || salesmen.length === 0) {
    return (
      <div>
        <Header
          title="Facturas por Vendedor"
          subtitle="No hay datos disponibles"
        />
        <div className="p-8 flex items-center justify-center">
          <div className="text-gray-500">No se encontraron datos de vendedores</div>
        </div>
      </div>
    );
  }

  // Obtener datos del mes seleccionado
  const selectedMonthData = salesmen.filter(
    (s) => s.year === selectedYear && s.monthNumber === selectedMonthNumber
  );

  // Calcular totales
  const totals = selectedMonthData.reduce(
    (acc, s) => ({
      net: acc.net + s.net,
      comissions: acc.comissions + s.comissions,
      margin: acc.margin + s.margin,
      discounts: acc.discounts + s.discounts,
      numberOfDocuments: acc.numberOfDocuments + s.numberOfDocuments,
    }),
    { net: 0, comissions: 0, margin: 0, discounts: 0, numberOfDocuments: 0 }
  );

  const averageTicket =
    totals.numberOfDocuments > 0 ? totals.net / totals.numberOfDocuments : 0;

  const monthName =
    selectedMonthData.length > 0 ? selectedMonthData[0].monthName : "";

  return (
    <div>
      <Header
        title="Facturas por Vendedor"
        subtitle="Análisis de ventas por vendedor"
      />

      <div className="p-8 space-y-6">
        {/* Selector de Año y Mes */}
        <div className="flex justify-end">
          <div className="bg-gray-50 border rounded-lg p-4 inline-block">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Año:
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    const newYear = Number(e.target.value);
                    setSelectedYear(newYear);
                    // Reset month to first available for new year
                    const monthsForYear = Array.from(
                      new Set(
                        salesmen
                          .filter((s) => s.year === newYear)
                          .map((s) => s.monthNumber)
                      )
                    ).sort((a, b) => b - a);
                    if (monthsForYear.length > 0) {
                      setSelectedMonthNumber(monthsForYear[0]);
                    }
                  }}
                  className="px-4 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-900"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Mes:
                </label>
                <select
                  value={selectedMonthNumber}
                  onChange={(e) =>
                    setSelectedMonthNumber(Number(e.target.value))
                  }
                  className="px-4 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-900"
                >
                  {availableMonths.map((m) => (
                    <option key={m.monthNumber} value={m.monthNumber}>
                      {m.monthName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen del Mes */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {monthName} {selectedYear}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Neto */}
            <Card>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Total Neto
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totals.net)}
                </p>
              </div>
            </Card>

            {/* Total Comisiones */}
            <Card>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Total Comisiones
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totals.comissions)}
                </p>
              </div>
            </Card>

            {/* Total Margen */}
            <Card>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Total Margen
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(totals.margin)}
                </p>
              </div>
            </Card>

            {/* Ticket Promedio */}
            <Card>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Ticket Promedio
                </p>
                <p className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(averageTicket)}
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Tabla de Vendedores */}
        {selectedMonthData.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="sticky top-0 bg-white px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Vendedor
                    </th>
                    <th className="sticky top-0 bg-white px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Neto
                    </th>
                    <th className="sticky top-0 bg-white px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Neto %
                    </th>
                    <th className="sticky top-0 bg-white px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Comisiones
                    </th>
                    <th className="sticky top-0 bg-white px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Margen
                    </th>
                    <th className="sticky top-0 bg-white px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Margen %
                    </th>
                    <th className="sticky top-0 bg-white px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Descuentos
                    </th>
                    <th className="sticky top-0 bg-white px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Descuentos %
                    </th>
                    <th className="sticky top-0 bg-white px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Documentos
                    </th>
                    <th className="sticky top-0 bg-white px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ticket Promedio
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedMonthData.map((salesman, index) => (
                    <tr
                      key={`${salesman.salesmanId}-${index}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{salesman.salesmanName}</div>
                          <div className="text-xs text-gray-500">
                            ID: {salesman.salesmanId}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(salesman.net)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {salesman.netPercentage}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatCurrency(salesman.comissions)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatCurrency(salesman.margin)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {salesman.marginPercentage}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatCurrency(salesman.discounts)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {salesman.discountsPercentage}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {salesman.numberOfDocuments.toLocaleString("es-CL")}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {salesman.averageTicket.toLocaleString("es-CL")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-center py-12 text-gray-500">
              No se encontraron datos para el mes seleccionado
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

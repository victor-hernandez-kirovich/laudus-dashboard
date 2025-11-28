"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { InvoicesBySalesmanData } from "@/lib/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TopVendedoresChart } from "@/components/charts/TopVendedoresChart";
import { SalesmanMonthlyPerformanceChart } from "@/components/charts/SalesmanMonthlyPerformanceChart";

export default function InvoicesBySalesmanPage() {
  const [salesmen, setSalesmen] = useState<InvoicesBySalesmanData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [selectedMonthNumber, setSelectedMonthNumber] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<number>(0);

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

  // Prepare data for Top Vendedores Chart
  const prepareTopVendedoresData = () => {
    return selectedMonthData
      .map((salesman) => ({
        salesmanName: salesman.salesmanName,
        net: salesman.net,
        margin: salesman.margin,
        marginPercentage: salesman.marginPercentage,
        numberOfDocuments: salesman.numberOfDocuments,
        averageTicket: salesman.averageTicket,
      }))
      .sort((a, b) => b.net - a.net);
  };

  // Get unique salesmen from selected month data
  const uniqueSalesmen = selectedMonthData
    .map((s) => ({
      id: s.salesmanId,
      name: s.salesmanName,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Prepare data for Monthly Performance Chart
  const prepareMonthlyPerformanceData = () => {
    if (!selectedSalesmanId) return [];

    return salesmen
      .filter(
        (s) => s.year === selectedYear && s.salesmanId === selectedSalesmanId
      )
      .map((s) => ({
        monthName: s.monthName,
        monthNumber: s.monthNumber,
        net: s.net,
        margin: s.margin,
        marginPercentage: s.marginPercentage,
        numberOfDocuments: s.numberOfDocuments,
        averageTicket: s.averageTicket,
      }));
  };

  const selectedSalesmanName =
    selectedMonthData.find((s) => s.salesmanId === selectedSalesmanId)
      ?.salesmanName || "";

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

        {/* Tabla de Vendedores */}
        {selectedMonthData.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full md:min-w-[1400px]">
                <thead>
                  <tr className="bg-purple-600">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider md:sticky md:left-0 bg-purple-600 md:z-10">
                      Vendedor
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                      Neto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                      Neto %
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                      Comisiones
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                      Margen
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                      Margen %
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                      Descuentos
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                      Descuentos %
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                      Documentos
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                      Ticket Promedio
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedMonthData.map((salesman, index) => (
                    <React.Fragment key={`${salesman.salesmanId}-${index}`}>
                      <tr className="hover:bg-purple-50 cursor-pointer transition-colors">
                        <td 
                          className="px-4 py-3 text-sm text-gray-900 md:sticky md:left-0 bg-white"
                          onClick={() => {
                            const isMobile = window.innerWidth < 768;
                            if (isMobile) {
                              const rowId = String(salesman.salesmanId);
                              setExpandedRow(expandedRow === rowId ? null : rowId);
                            }
                          }}
                        >
                          <div>
                            <div className="font-medium">{salesman.salesmanName}</div>
                            <div className="text-xs text-gray-500">
                              ID: {salesman.salesmanId}
                            </div>
                          </div>
                        </td>
                        <td 
                          className="px-4 py-3 text-sm text-gray-900"
                          onClick={() => {
                            const isMobile = window.innerWidth < 768;
                            if (isMobile) {
                              const rowId = String(salesman.salesmanId);
                              setExpandedRow(expandedRow === rowId ? null : rowId);
                            }
                          }}
                        >
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-right">{formatCurrency(salesman.net)}</span>
                            <span className="md:hidden">
                              {expandedRow === String(salesman.salesmanId) ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell">
                          {salesman.netPercentage}%
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell">
                          {formatCurrency(salesman.comissions)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell">
                          {formatCurrency(salesman.margin)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell">
                          {salesman.marginPercentage}%
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell">
                          {formatCurrency(salesman.discounts)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell">
                          {salesman.discountsPercentage}%
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell">
                          {salesman.numberOfDocuments.toLocaleString("es-CL")}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell">
                          {formatCurrency(salesman.averageTicket)}
                        </td>
                      </tr>

                      {/* Fila expandida para mobile */}
                      {expandedRow === String(salesman.salesmanId) && (
                        <tr className="md:hidden bg-gray-50">
                          <td colSpan={2} className="px-4 py-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-500">Neto %:</span>
                                <span className="text-sm text-gray-900">{salesman.netPercentage}%</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-500">Comisiones:</span>
                                <span className="text-sm text-gray-900">{formatCurrency(salesman.comissions)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-500">Margen:</span>
                                <span className="text-sm text-gray-900">{formatCurrency(salesman.margin)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-500">Margen %:</span>
                                <span className="text-sm text-gray-900">{salesman.marginPercentage}%</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-500">Descuentos:</span>
                                <span className="text-sm text-gray-900">{formatCurrency(salesman.discounts)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-500">Descuentos %:</span>
                                <span className="text-sm text-gray-900">{salesman.discountsPercentage}%</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-500">Documentos:</span>
                                <span className="text-sm text-gray-900">{salesman.numberOfDocuments.toLocaleString("es-CL")}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-500">Ticket Promedio:</span>
                                <span className="text-sm text-gray-900">{formatCurrency(salesman.averageTicket)}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}

                  {/* Fila de Totales */}
                  <tr className="bg-purple-100 border-t-2 border-purple-300">
                    <td className="px-4 py-4 text-sm text-gray-900 uppercase font-bold md:sticky md:left-0 bg-purple-100">
                      Total {monthName} {selectedYear}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold">
                      {formatCurrency(totals.net)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                      100.00%
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                      {formatCurrency(totals.comissions)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                      {formatCurrency(totals.margin)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                      {totals.net > 0 ? ((totals.margin / totals.net) * 100).toFixed(2) : '0.00'}%
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                      {formatCurrency(totals.discounts)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                      {totals.net > 0 ? ((totals.discounts / totals.net) * 100).toFixed(2) : '0.00'}%
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                      {totals.numberOfDocuments.toLocaleString("es-CL")}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                      {formatCurrency(averageTicket)}
                    </td>
                  </tr>
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

        {/* Gráfica: Top Vendedores */}
        {selectedMonthData.length > 0 && (
          <Card>
             
            <div className="p-6">
              <div className="w-full md:w-1/2">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Ranking de vendedores por volumen de ventas netas
                </h3>
                <h4 className="text-m font-bold text-gray-900">
                  {monthName} {selectedYear}
                </h4>
                
                <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs font-semibold text-purple-900 mb-1">
                    💡 Cálculo:
                  </p>
                  <p className="text-xs text-purple-800">
                    <strong>Ranking</strong> = Ordenados de mayor a menor por ventas netas
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    El color más oscuro representa al vendedor #1. Identifica rápidamente a los vendedores estrella del mes.
                  </p>
                </div>
              </div>
              </div>
              <TopVendedoresChart data={prepareTopVendedoresData()} topN={10} />
            </div>
          </Card>
        )}

        {/* Gráfica: Desempeño Mensual por Vendedor */}
        {selectedMonthData.length > 0 && (
          <Card>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  📊 Desempeño Mensual por Vendedor
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Ventas netas mensuales del vendedor seleccionado
                </p>

                {/* Selectores de Año y Vendedor */}
                <div className="w-full md:w-1/2">
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Año:
                        </label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                          className="w-full px-4 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium text-gray-900"
                        >
                          {availableYears.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vendedor:
                        </label>
                        <select
                          value={selectedSalesmanId}
                          onChange={(e) => setSelectedSalesmanId(Number(e.target.value))}
                          className="w-full px-4 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium text-gray-900"
                        >
                          <option value={0}>-- Seleccione un vendedor --</option>
                          {uniqueSalesmen.map((salesman) => (
                            <option key={salesman.id} value={salesman.id}>
                              {salesman.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {selectedSalesmanId > 0 && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-xs font-semibold text-purple-900 mb-1">
                        💡 Análisis:
                      </p>
                      <p className="text-xs text-purple-800">
                        Este gráfico muestra el desempeño mensual de <strong>{selectedSalesmanName}</strong> durante el año {selectedYear}
                      </p>
                      <p className="text-xs text-purple-700 mt-1">
                        Identifica tendencias, picos de ventas y oportunidades de mejora mes a mes.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedSalesmanId > 0 ? (
                prepareMonthlyPerformanceData().length > 0 ? (
                  <SalesmanMonthlyPerformanceChart
                    data={prepareMonthlyPerformanceData()}
                    salesmanName={selectedSalesmanName}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No hay datos disponibles para este vendedor en {selectedYear}
                  </div>
                )
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Seleccione un vendedor para ver su desempeño mensual
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

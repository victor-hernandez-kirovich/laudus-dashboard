"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { VentasNetasChart } from "@/components/charts/VentasNetasChart";
import { MargenMensualChart } from "@/components/charts/MargenMensualChart";
import { DevolucionesChart } from "@/components/charts/DevolucionesChart";

interface InvoiceData {
  month: string;
  year: number;
  monthNumber: number;
  monthName: string;
  total: number;
  returns: number;
  returnsPercentage: number;
  net: number;
  netChangeYoYPercentage: number;
  margin: number;
  marginChangeYoYPercentage: number;
  discounts: number;
  discountsPercentage: number;
  quantity: number;
  insertedAt: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<InvoiceData | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compute available years from invoices
  const availableYears = Array.from(
    new Set(invoices.map((inv) => inv.year))
  ).sort((a, b) => b - a);

  // Get months for selected year
  const monthsForYear = invoices
    .filter((inv) => inv.year === selectedYear)
    .sort((a, b) => a.monthNumber - b.monthNumber); // Orden ascendente (Ene-Dic)

  // Calculate totals for the year
  const yearTotals = monthsForYear.reduce(
    (acc, inv) => ({
      total: acc.total + inv.total,
      returns: acc.returns + inv.returns,
      net: acc.net + inv.net,
      margin: acc.margin + inv.margin,
      discounts: acc.discounts + inv.discounts,
      quantity: acc.quantity + inv.quantity,
    }),
    { total: 0, returns: 0, net: 0, margin: 0, discounts: 0, quantity: 0 }
  );

  // Preparar datos para gráfica de Ventas Netas (multi-año)
  const prepareVentasNetasData = () => {
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    return monthNames.map((monthName, index) => {
      const monthNumber = index + 1;
      const dataPoint: any = {
        month: `${monthNumber}`,
        monthName: monthName,
      };

      // Agregar datos de cada año disponible
      availableYears.forEach(year => {
        const monthData = invoices.find(
          inv => inv.year === year && inv.monthNumber === monthNumber
        );
        dataPoint[`net${year}`] = monthData ? monthData.net : 0;
      });

      return dataPoint;
    });
  };

  // Preparar datos para gráfica de Margen Mensual
  const prepareMargenData = () => {
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    return monthNames.map((monthName, index) => {
      const monthNumber = index + 1;
      const monthData = invoices.find(
        inv => inv.year === selectedYear && inv.monthNumber === monthNumber
      );

      return {
        month: `${monthNumber}`,
        monthName: monthName,
        margen: monthData ? monthData.margin : 0,
        margenPercentage: monthData && monthData.net > 0 
          ? (monthData.margin / monthData.net) * 100 
          : 0,
      };
    });
  };

  // Preparar datos para gráfica de Devoluciones
  const prepareDevolucionesData = () => {
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    return monthNames.map((monthName, index) => {
      const monthNumber = index + 1;
      const monthData = invoices.find(
        inv => inv.year === selectedYear && inv.monthNumber === monthNumber
      );

      return {
        month: `${monthNumber}`,
        monthName: monthName,
        returns: monthData ? monthData.returns : 0,
        returnsPercentage: monthData ? monthData.returnsPercentage : 0,
      };
    });
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/data/invoices");
        if (!res.ok) throw new Error("Error al cargar datos");
        const result = await res.json();
        setInvoices(result.data);
        // Seleccionar el año más reciente por defecto
        if (result.data && result.data.length > 0) {
          const mostRecent = result.data[0];
          setSelectedYear(mostRecent.year);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div>
        <Header
          title="Facturas Mensuales"
          subtitle="Reporte de ventas por mes"
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
          title="Facturas Mensuales"
          subtitle="Reporte de ventas por mes"
        />
        <div className="p-8">
          <Card>
            <div className="text-red-600">Error: {error}</div>
          </Card>
        </div>
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div>
        <Header
          title="Facturas Mensuales"
          subtitle="No hay datos disponibles"
        />
        <div className="p-8 flex items-center justify-center">
          <div className="text-gray-500">No se encontraron facturas</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Facturas Mensuales"
        subtitle="Análisis de ventas agregadas por mes"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Selector de Año */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Año {selectedYear}
          </h2>
          <div className="bg-gray-50 border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Año:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-900"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Meses */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full md:min-w-[1400px]">
              <thead>
                <tr className="bg-blue-600">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider md:sticky md:left-0 bg-blue-600 md:z-10">
                    Mes
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider md:table-cell">
                    Total Bruto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                    Devoluciones
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                    Devoluc. %
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                    Total Neto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                    Neto YoY %
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                    Margen
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                    Margen YoY %
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                    Descuentos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                    Desctos. %
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider md:hidden w-10">
                    
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthsForYear.map((invoice) => (
                  <React.Fragment key={invoice.month}>
                    <tr
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td 
                        className="px-4 py-3 text-sm font-medium text-gray-900 md:sticky md:left-0 bg-white"
                        onClick={() => {
                          const isMobile = window.innerWidth < 768;
                          if (isMobile) {
                            setExpandedRow(expandedRow === invoice.month ? null : invoice.month);
                          } else {
                            setSelectedMonth(invoice);
                          }
                        }}
                      >
                        {invoice.monthName}
                      </td>
                      <td 
                        className="px-4 py-3 text-sm text-gray-900"
                        onClick={() => {
                          const isMobile = window.innerWidth < 768;
                          if (isMobile) {
                            setExpandedRow(expandedRow === invoice.month ? null : invoice.month);
                          } else {
                            setSelectedMonth(invoice);
                          }
                        }}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-right">{formatCurrency(invoice.total)}</span>
                          <span className="md:hidden">
                            {expandedRow === invoice.month ? (
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell" onClick={() => setSelectedMonth(invoice)}>
                        {formatCurrency(invoice.returns)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell" onClick={() => setSelectedMonth(invoice)}>
                        {invoice.returnsPercentage.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell" onClick={() => setSelectedMonth(invoice)}>
                        {formatCurrency(invoice.net)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell" onClick={() => setSelectedMonth(invoice)}>
                        {invoice.netChangeYoYPercentage > 0 ? "↑" : invoice.netChangeYoYPercentage < 0 ? "↓" : ""}
                        {invoice.netChangeYoYPercentage.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell" onClick={() => setSelectedMonth(invoice)}>
                        {formatCurrency(invoice.margin)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell" onClick={() => setSelectedMonth(invoice)}>
                        {invoice.marginChangeYoYPercentage > 0 ? "↑" : invoice.marginChangeYoYPercentage < 0 ? "↓" : ""}
                        {invoice.marginChangeYoYPercentage.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell" onClick={() => setSelectedMonth(invoice)}>
                        {formatCurrency(invoice.discounts)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell" onClick={() => setSelectedMonth(invoice)}>
                        {invoice.discountsPercentage.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell" onClick={() => setSelectedMonth(invoice)}>
                        {invoice.quantity.toLocaleString("es-CL")}
                      </td>
                    </tr>
                    
                    {/* Fila expandida para mobile */}
                    {expandedRow === invoice.month && (
                      <tr className="md:hidden bg-gray-50">
                        <td colSpan={2} className="px-4 py-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-500">Devoluciones:</span>
                              <span className="text-sm text-gray-900">{formatCurrency(invoice.returns)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-500">Devoluciones %:</span>
                              <span className="text-sm text-gray-900">{invoice.returnsPercentage.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-500">Total Neto:</span>
                              <span className="text-sm text-gray-900">{formatCurrency(invoice.net)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-500">Neto YoY %:</span>
                              <span className="text-sm text-gray-900">
                                {invoice.netChangeYoYPercentage > 0 ? "↑" : invoice.netChangeYoYPercentage < 0 ? "↓" : ""}
                                {invoice.netChangeYoYPercentage.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-500">Margen:</span>
                              <span className="text-sm text-gray-900">{formatCurrency(invoice.margin)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-500">Margen YoY %:</span>
                              <span className="text-sm text-gray-900">
                                {invoice.marginChangeYoYPercentage > 0 ? "↑" : invoice.marginChangeYoYPercentage < 0 ? "↓" : ""}
                                {invoice.marginChangeYoYPercentage.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-500">Descuentos:</span>
                              <span className="text-sm text-gray-900">{formatCurrency(invoice.discounts)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-500">Descuentos %:</span>
                              <span className="text-sm text-gray-900">{invoice.discountsPercentage.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-500">Cantidad:</span>
                              <span className="text-sm text-gray-900">{invoice.quantity.toLocaleString("es-CL")}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                
                {/* Fila de Totales */}
                {monthsForYear.length > 0 && (
                  <tr className="bg-blue-100 border-t-2 border-blue-300">
                    <td className="px-4 py-4 text-sm text-gray-900 uppercase font-bold md:sticky md:left-0 bg-blue-100">
                      Total {selectedYear}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold md:table-cell">
                      {formatCurrency(yearTotals.total)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                      {formatCurrency(yearTotals.returns)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                      {yearTotals.total > 0 ? ((yearTotals.returns / yearTotals.total) * 100).toFixed(2) : '0.00'}%
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                      {formatCurrency(yearTotals.net)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                      -
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                      {formatCurrency(yearTotals.margin)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                      -
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                      {formatCurrency(yearTotals.discounts)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                      {yearTotals.net > 0 ? ((yearTotals.discounts / yearTotals.net) * 100).toFixed(2) : '0.00'}%
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                      {yearTotals.quantity.toLocaleString("es-CL")}
                    </td>
                    <td className="md:hidden"></td>
                  </tr>
                )}
              </tbody>
            </table>

            {monthsForYear.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No hay datos disponibles para {selectedYear}
              </div>
            )}
          </div>
        </Card>

        {/* Gráficas de Análisis */}
        <div className="space-y-6">
          {/* Gráfica 1: Ventas Netas Mensuales - Comparación Multi-año */}
          <Card>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  📈 Evolución de Ventas Netas
                </h3>
                <p className="text-sm text-gray-600">
                  Comparación de ventas netas por mes entre diferentes años
                </p>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-1">
                    💡 Cálculo:
                  </p>
                  <p className="text-xs text-blue-800">
                    <strong>Ventas Netas</strong> = Total Bruto - Devoluciones
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Representa las ventas reales después de descontar productos devueltos por los clientes.
                  </p>
                </div>
              </div>
              <VentasNetasChart
                data={prepareVentasNetasData()}
                years={availableYears}
              />
            </div>
          </Card>

          {/* Gráficas 2 y 3: Margen y Devoluciones lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfica 2: Margen Mensual */}
            <Card>
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    💰 Margen Mensual {selectedYear}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Evolución del margen en monto y porcentaje
                  </p>
                  <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs font-semibold text-purple-900 mb-1">
                      💡 Cálculo:
                    </p>
                    <p className="text-xs text-purple-800">
                      <strong>Monto de Margen</strong> = Utilidad bruta del mes
                    </p>
                    <p className="text-xs text-purple-800">
                      <strong>% de Margen</strong> = (Margen ÷ Ventas Netas) × 100
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                      Indica la rentabilidad: cuánto ganamos por cada peso vendido.
                    </p>
                  </div>
                </div>
                <MargenMensualChart
                  data={prepareMargenData()}
                  year={selectedYear}
                />
              </div>
            </Card>

            {/* Gráfica 3: Devoluciones */}
            <Card>
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    📉 Devoluciones {selectedYear}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Monto y porcentaje de devoluciones por mes
                  </p>
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs font-semibold text-red-900 mb-1">
                      💡 Cálculo:
                    </p>
                    <p className="text-xs text-red-800">
                      <strong>Monto de Devoluciones</strong> = Total de productos devueltos
                    </p>
                    <p className="text-xs text-red-800">
                      <strong>% de Devoluciones</strong> = (Devoluciones ÷ Total Bruto) × 100
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      Un porcentaje alto puede indicar problemas de calidad o satisfacción del cliente.
                    </p>
                  </div>
                </div>
                <DevolucionesChart
                  data={prepareDevolucionesData()}
                  year={selectedYear}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Detalle */}
      {selectedMonth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedMonth.monthName} {selectedMonth.year}
              </h3>
              <button
                onClick={() => setSelectedMonth(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Total Bruto */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Total Bruto
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedMonth.total)}
                  </p>
                </div>

                {/* Devoluciones */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Devoluciones
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(selectedMonth.returns)}
                  </p>
                </div>

                {/* Devoluciones % */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Devoluciones %
                  </p>
                  <p className="text-2xl font-bold text-red-500">
                    {selectedMonth.returnsPercentage.toFixed(2)}%
                  </p>
                </div>

                {/* Total Neto */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Total Neto
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(selectedMonth.net)}
                  </p>
                </div>

                {/* Neto Cambio YoY */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Neto Cambio YoY
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      selectedMonth.netChangeYoYPercentage > 0
                        ? "text-green-600"
                        : selectedMonth.netChangeYoYPercentage < 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {selectedMonth.netChangeYoYPercentage > 0 ? "↑" : selectedMonth.netChangeYoYPercentage < 0 ? "↓" : ""}{" "}
                    {selectedMonth.netChangeYoYPercentage.toFixed(2)}%
                  </p>
                </div>

                {/* Margen */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Margen
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(selectedMonth.margin)}
                  </p>
                </div>

                {/* Margen Cambio YoY */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Margen Cambio YoY
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      selectedMonth.marginChangeYoYPercentage > 0
                        ? "text-green-600"
                        : selectedMonth.marginChangeYoYPercentage < 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {selectedMonth.marginChangeYoYPercentage > 0 ? "↑" : selectedMonth.marginChangeYoYPercentage < 0 ? "↓" : ""}{" "}
                    {selectedMonth.marginChangeYoYPercentage.toFixed(2)}%
                  </p>
                </div>

                {/* Descuentos */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Descuentos
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(selectedMonth.discounts)}
                  </p>
                </div>

                {/* Descuentos % */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Descuentos %
                  </p>
                  <p className="text-2xl font-bold text-orange-500">
                    {selectedMonth.discountsPercentage.toFixed(2)}%
                  </p>
                </div>

                {/* Cantidad */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Cantidad
                  </p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {selectedMonth.quantity.toLocaleString("es-CL")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

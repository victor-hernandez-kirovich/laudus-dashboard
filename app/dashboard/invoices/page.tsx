"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { VentasNetasChart } from "@/components/charts/VentasNetasChart";
import { VentasBrutasVsNetasChart } from "@/components/charts/VentasBrutasVsNetasChart";
import { DevolucionesVsDescuentosChart } from "@/components/charts/DevolucionesVsDescuentosChart";
import { CantidadMensualChart } from "@/components/charts/CantidadMensualChart";

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

  // Estados independientes para cada gráfico
  const [chartYearBrutasVsNetas, setChartYearBrutasVsNetas] = useState<number>(0);
  const [chartYearDevDesc, setChartYearDevDesc] = useState<number>(0);
  const [chartYearCantidad, setChartYearCantidad] = useState<number>(0);

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

  // Preparar datos para gráfica de Ventas Brutas vs Netas (año específico)
  const prepareVentasBrutasVsNetasData = (year: number) => {
    const monthsData = invoices
      .filter((inv) => inv.year === year)
      .sort((a, b) => a.monthNumber - b.monthNumber);
    return monthsData.map((inv) => ({
      month: `${inv.monthNumber}`,
      monthName: inv.monthName,
      ventasBrutas: inv.total,
      ventasNetas: inv.net,
    }));
  };

  // Preparar datos para gráfica de Devoluciones vs Descuentos (año específico)
  const prepareDevolucionesVsDescuentosData = (year: number) => {
    const monthsData = invoices
      .filter((inv) => inv.year === year)
      .sort((a, b) => a.monthNumber - b.monthNumber);
    return monthsData.map((inv) => ({
      month: `${inv.monthNumber}`,
      monthName: inv.monthName,
      devoluciones: inv.returns,
      descuentos: inv.discounts,
      devolucionesPct: inv.returnsPercentage,
      descuentosPct: inv.discountsPercentage,
    }));
  };

  // Preparar datos para gráfica de Cantidad Mensual (año específico)
  const prepareCantidadMensualData = (year: number) => {
    const monthsData = invoices
      .filter((inv) => inv.year === year)
      .sort((a, b) => a.monthNumber - b.monthNumber);
    return monthsData.map((inv) => ({
      month: `${inv.monthNumber}`,
      monthName: inv.monthName,
      cantidad: inv.quantity,
    }));
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/data/invoices");
        if (!res.ok) throw new Error("Error al cargar datos");
        const result = await res.json();
        setInvoices(result.data);
        // Seleccionar el año más reciente por defecto para todos los selectores
        if (result.data && result.data.length > 0) {
          const mostRecent = result.data[0];
          setSelectedYear(mostRecent.year);
          setChartYearBrutasVsNetas(mostRecent.year);
          setChartYearDevDesc(mostRecent.year);
          setChartYearCantidad(mostRecent.year);
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
                {availableYears.map((year, index) => (
                  <option key={`year-${year}-${index}`} value={year}>
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

          {/* Gráfica 2: Ventas Brutas vs Ventas Netas */}
          <Card>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      📊 Ventas Brutas vs Ventas Netas
                    </h3>
                    <p className="text-sm text-gray-600">
                      Comparación mensual entre ventas brutas y netas para visualizar el impacto de las devoluciones
                    </p>
                  </div>
                  <select
                    value={chartYearBrutasVsNetas}
                    onChange={(e) => setChartYearBrutasVsNetas(Number(e.target.value))}
                    className="px-3 py-1.5 border-2 border-green-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-medium text-gray-900 text-sm"
                  >
                    {availableYears.map((year, index) => (
                      <option key={`chart2-year-${year}-${index}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs font-semibold text-green-900 mb-1">
                    💡 Interpretación:
                  </p>
                  <p className="text-xs text-green-800">
                    <strong>Ventas Brutas</strong> = Total facturado antes de devoluciones
                  </p>
                  <p className="text-xs text-green-800">
                    <strong>Ventas Netas</strong> = Ventas Brutas - Devoluciones
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    La diferencia entre ambas líneas representa el monto de devoluciones de cada mes.
                  </p>
                </div>
              </div>
              <VentasBrutasVsNetasChart
                data={prepareVentasBrutasVsNetasData(chartYearBrutasVsNetas)}
                selectedYear={chartYearBrutasVsNetas}
              />
            </div>
          </Card>

          {/* Gráfica 3: Devoluciones vs Descuentos */}
          <Card>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      📉 Devoluciones vs Descuentos
                    </h3>
                    <p className="text-sm text-gray-600">
                      Comparación mensual entre devoluciones y descuentos aplicados
                    </p>
                  </div>
                  <select
                    value={chartYearDevDesc}
                    onChange={(e) => setChartYearDevDesc(Number(e.target.value))}
                    className="px-3 py-1.5 border-2 border-red-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-medium text-gray-900 text-sm"
                  >
                    {availableYears.map((year, index) => (
                      <option key={`chart3-year-${year}-${index}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs font-semibold text-red-900 mb-1">
                    💡 Interpretación:
                  </p>
                  <p className="text-xs text-red-800">
                    <strong>Devoluciones</strong> = Productos devueltos por clientes (reducen ventas brutas)
                  </p>
                  <p className="text-xs text-red-800">
                    <strong>Descuentos</strong> = Rebajas aplicadas en las ventas (reducen margen)
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Ambos conceptos representan deducciones que afectan la rentabilidad del negocio.
                  </p>
                </div>
              </div>
              <DevolucionesVsDescuentosChart
                data={prepareDevolucionesVsDescuentosData(chartYearDevDesc)}
                selectedYear={chartYearDevDesc}
              />
            </div>
          </Card>

          {/* Gráfica 4: Cantidad de Facturas Mensual */}
          <Card>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      📝 Cantidad de Facturas
                    </h3>
                    <p className="text-sm text-gray-600">
                      Número de facturas emitidas por mes
                    </p>
                  </div>
                  <select
                    value={chartYearCantidad}
                    onChange={(e) => setChartYearCantidad(Number(e.target.value))}
                    className="px-3 py-1.5 border-2 border-indigo-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-gray-900 text-sm"
                  >
                    {availableYears.map((year, index) => (
                      <option key={`chart4-year-${year}-${index}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-xs font-semibold text-indigo-900 mb-1">
                    💡 Interpretación:
                  </p>
                  <p className="text-xs text-indigo-800">
                    <strong>Cantidad</strong> = Número total de documentos de venta emitidos
                  </p>
                  <p className="text-xs text-indigo-700 mt-1">
                    Permite identificar la actividad comercial y estacionalidad del negocio.
                  </p>
                </div>
              </div>
              <CantidadMensualChart
                data={prepareCantidadMensualData(chartYearCantidad)}
                selectedYear={chartYearCantidad}
              />
            </div>
          </Card>
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

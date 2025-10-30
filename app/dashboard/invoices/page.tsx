"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

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
  const [selectedMonthNumber, setSelectedMonthNumber] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compute available years from invoices
  const availableYears = Array.from(
    new Set(invoices.map((inv) => inv.year))
  ).sort((a, b) => b - a);

  // Compute available months for selected year
  const availableMonths = invoices
    .filter((inv) => inv.year === selectedYear)
    .sort((a, b) => b.monthNumber - a.monthNumber);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/data/invoices");
        if (!res.ok) throw new Error("Error al cargar datos");
        const result = await res.json();
        setInvoices(result.data);
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
    if (selectedYear && invoices.length > 0) {
      const monthsForYear = invoices
        .filter((inv) => inv.year === selectedYear)
        .sort((a, b) => b.monthNumber - a.monthNumber);
      if (monthsForYear.length > 0 && selectedMonthNumber === 0) {
        setSelectedMonthNumber(monthsForYear[0].monthNumber);
      }
    }
  }, [selectedYear, invoices, selectedMonthNumber]);

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

  // Obtener datos del mes seleccionado
  const selectedData = invoices.find(
    (inv) => inv.year === selectedYear && inv.monthNumber === selectedMonthNumber
  );

  return (
    <div>
      <Header
        title="Facturas Mensuales"
        subtitle="Análisis de ventas agregadas por mes"
      />

      <div className="p-8 space-y-6">
        {/* Selector de Año y Mes */}
        <div className="flex justify-end">
          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 inline-block shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Año:
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    const newYear = Number(e.target.value);
                    setSelectedYear(newYear);
                    // Reset month to first available for new year
                    const monthsForYear = invoices
                      .filter((inv) => inv.year === newYear)
                      .sort((a, b) => b.monthNumber - a.monthNumber);
                    if (monthsForYear.length > 0) {
                      setSelectedMonthNumber(monthsForYear[0].monthNumber);
                    }
                  }}
                  className="px-4 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium text-gray-900 hover:border-gray-500 transition-colors"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Mes:
                </label>
                <select
                  value={selectedMonthNumber}
                  onChange={(e) =>
                    setSelectedMonthNumber(Number(e.target.value))
                  }
                  className="px-4 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium text-gray-900 hover:border-gray-500 transition-colors"
                >
                  {availableMonths.map((inv) => (
                    <option key={inv.month} value={inv.monthNumber}>
                      {inv.monthName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Datos del Mes Seleccionado */}
        {selectedData ? (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {selectedData.monthName} {selectedData.year}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Total Bruto */}
              <Card>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Total Bruto
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedData.total)}
                  </p>
                </div>
              </Card>

              {/* Devoluciones */}
              <Card>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Devoluciones
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(selectedData.returns)}
                  </p>
                </div>
              </Card>

              {/* Devoluciones Porcentaje */}
              <Card>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Devoluciones %
                  </p>
                  <p className="text-2xl font-bold text-red-500">
                    {selectedData.returnsPercentage}%
                  </p>
                </div>
              </Card>

              {/* Total Neto */}
              <Card>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Total Neto
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(selectedData.net)}
                  </p>
                </div>
              </Card>

              {/* Neto Cambio YoY */}
              <Card>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Neto Cambio YoY
                  </p>
                  <p className={`text-2xl font-bold ${
                    selectedData.netChangeYoYPercentage > 0 
                      ? 'text-green-600' 
                      : selectedData.netChangeYoYPercentage < 0 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                  }`}>
                    {selectedData.netChangeYoYPercentage > 0 ? "↑" : selectedData.netChangeYoYPercentage < 0 ? "↓" : ""}{" "}
                    {selectedData.netChangeYoYPercentage}%
                  </p>
                </div>
              </Card>

              {/* Margen */}
              <Card>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Margen
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(selectedData.margin)}
                  </p>
                </div>
              </Card>

              {/* Margen Cambio YoY */}
              <Card>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Margen Cambio YoY
                  </p>
                  <p className={`text-2xl font-bold ${
                    selectedData.marginChangeYoYPercentage > 0 
                      ? 'text-green-600' 
                      : selectedData.marginChangeYoYPercentage < 0 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                  }`}>
                    {selectedData.marginChangeYoYPercentage > 0 ? "↑" : selectedData.marginChangeYoYPercentage < 0 ? "↓" : ""}{" "}
                    {selectedData.marginChangeYoYPercentage}%
                  </p>
                </div>
              </Card>

              {/* Descuentos */}
              <Card>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Descuentos
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(selectedData.discounts)}
                  </p>
                </div>
              </Card>

              {/* Descuentos Porcentaje */}
              <Card>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Descuentos %
                  </p>
                  <p className="text-2xl font-bold text-orange-500">
                    {selectedData.discountsPercentage}%
                  </p>
                </div>
              </Card>

              {/* Cantidad */}
              <Card>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {selectedData.quantity.toLocaleString("es-CL")}
                  </p>
                </div>
              </Card>
            </div>
          </div>
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

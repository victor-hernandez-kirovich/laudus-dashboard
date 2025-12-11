'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { Building2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { BranchCombinedChart } from '@/components/charts/BranchCombinedChart'
import { BranchMarketShareChart } from '@/components/charts/BranchMarketShareChart'

interface BranchData {
  branch: string
  net: number
  netPercentage: number
  margin: number
  marginPercentage: number
  discounts: number
  discountsPercentage: number
}

interface InvoicesByBranchData {
  month: string
  year: number
  monthNumber: number
  monthName: string
  startDate: string
  endDate: string
  branches: BranchData[]
  totalNet: number
  totalMargin: number
  totalDiscounts: number
  avgMarginPercentage: number
  avgDiscountPercentage: number
  branchCount: number
  insertedAt: string
}

interface BranchAnnualData {
  branch: string
  months: {
    [monthNumber: number]: {
      net: number
      netPercentage: number
      margin: number
      marginPercentage: number
      discounts: number
      discountsPercentage: number
    }
  }
  totalNet: number
  totalMargin: number
  totalDiscounts: number
  avgNet: number
  avgMargin: number
  avgDiscounts: number
}

export default function InvoicesByBranchPage() {
  const [allData, setAllData] = useState<InvoicesByBranchData[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(0)
  const [selectedMonth, setSelectedMonth] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/data/invoices/branch')
      const result = await response.json()
      
      if (result.success && result.data.length > 0) {
        setAllData(result.data)
        // Select the most recent year and month by default
        setSelectedYear(result.data[0].year)
        setSelectedMonth(result.data[0].monthNumber)
      }
    } catch (error) {
      console.error('Error fetching invoices by branch:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get unique years for year selector
  const availableYears = Array.from(new Set(allData.map(d => d.year))).sort((a, b) => b - a)
  
  // Get available months for selected year
  const availableMonths = Array.from(
    allData
      .filter((d) => d.year === selectedYear)
      .reduce((map, d) => {
        if (!map.has(d.monthNumber)) {
          map.set(d.monthNumber, { monthNumber: d.monthNumber, monthName: d.monthName });
        }
        return map;
      }, new Map<number, { monthNumber: number; monthName: string }>())
      .values()
  ).sort((a, b) => b.monthNumber - a.monthNumber)
  
  // Process data to create annual view by branch
  const processAnnualData = (): BranchAnnualData[] => {
    const yearData = allData.filter(d => d.year === selectedYear)
    const branchMap = new Map<string, BranchAnnualData>()

    // Aggregate data by branch
    yearData.forEach(monthData => {
      monthData.branches.forEach(branch => {
        if (!branchMap.has(branch.branch)) {
          branchMap.set(branch.branch, {
            branch: branch.branch,
            months: {},
            totalNet: 0,
            totalMargin: 0,
            totalDiscounts: 0,
            avgNet: 0,
            avgMargin: 0,
            avgDiscounts: 0,
          })
        }

        const branchAnnual = branchMap.get(branch.branch)!
        branchAnnual.months[monthData.monthNumber] = {
          net: branch.net,
          netPercentage: branch.netPercentage,
          margin: branch.margin,
          marginPercentage: branch.marginPercentage,
          discounts: branch.discounts,
          discountsPercentage: branch.discountsPercentage,
        }

        // Accumulate totals
        branchAnnual.totalNet += branch.net
        branchAnnual.totalMargin += branch.margin
        branchAnnual.totalDiscounts += branch.discounts
      })
    })

    // Calculate averages and sort by total net (descending)
    const branchesArray = Array.from(branchMap.values())
    branchesArray.forEach(branch => {
      const monthCount = Object.keys(branch.months).length
      if (monthCount > 0) {
        branch.avgNet = branch.totalNet / monthCount
        branch.avgMargin = branch.totalMargin / monthCount
        branch.avgDiscounts = branch.totalDiscounts / monthCount
      }
    })

    // Sort by total net sales (highest first)
    return branchesArray.sort((a, b) => b.totalNet - a.totalNet)
  }

  const branchesAnnualData = processAnnualData()

  // Month names for table headers
  const monthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ]

  // Color palette for branches
  const branchColors = [
    "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
    "#6366f1", "#d946ef", "#22c55e", "#eab308", "#f43f5e"
  ]

  // Prepare data for Top Sucursales Chart (stacked monthly bars)
  const prepareTopSucursalesData = () => {
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]

    const monthlyData: any[] = []

    // Initialize each month
    for (let i = 1; i <= 12; i++) {
      const monthObj: any = {
        month: `month${i}`,
        monthName: monthNames[i - 1]
      }
      
      // Add data for each branch
      branchesAnnualData.forEach(branch => {
        // branch.months is an object with numeric keys (1-12), not an array
        monthObj[branch.branch] = branch.months[i] ? branch.months[i].net : 0
      })

      monthlyData.push(monthObj)
    }

    return monthlyData
  }

  // Helper function to process data for any year
  const processAnnualDataForYear = (year: number): BranchAnnualData[] => {
    const yearData = allData.filter(d => d.year === year)
    const branchMap = new Map<string, BranchAnnualData>()

    yearData.forEach(monthData => {
      monthData.branches.forEach(branch => {
        if (!branchMap.has(branch.branch)) {
          branchMap.set(branch.branch, {
            branch: branch.branch,
            months: {},
            totalNet: 0,
            totalMargin: 0,
            totalDiscounts: 0,
            avgNet: 0,
            avgMargin: 0,
            avgDiscounts: 0,
          })
        }

        const branchAnnual = branchMap.get(branch.branch)!
        branchAnnual.months[monthData.monthNumber] = {
          net: branch.net,
          netPercentage: branch.netPercentage,
          margin: branch.margin,
          marginPercentage: branch.marginPercentage,
          discounts: branch.discounts,
          discountsPercentage: branch.discountsPercentage,
        }

        branchAnnual.totalNet += branch.net
        branchAnnual.totalMargin += branch.margin
        branchAnnual.totalDiscounts += branch.discounts
      })
    })

    const branchesArray = Array.from(branchMap.values())
    branchesArray.forEach(branch => {
      const monthCount = Object.keys(branch.months).length
      if (monthCount > 0) {
        branch.avgNet = branch.totalNet / monthCount
        branch.avgMargin = branch.totalMargin / monthCount
        branch.avgDiscounts = branch.totalDiscounts / monthCount
      }
    })

    return branchesArray.sort((a, b) => b.totalNet - a.totalNet)
  }

  // Prepare branch info for colors
  const prepareBranchInfo = () => {
    return branchesAnnualData.map((branch, index) => ({
      name: branch.branch,
      color: branchColors[index % branchColors.length]
    }))
  }

  // Prepare data for Monthly Trends Chart (line chart)
  const prepareMonthlyTrendsData = () => {
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]

    const monthlyData: any[] = []

    // For each month, create an object with all branch values
    for (let i = 1; i <= 12; i++) {
      const monthObj: any = {
        monthName: monthNames[i - 1],
        monthNumber: i
      }
      
      branchesAnnualData.forEach(branch => {
        monthObj[branch.branch] = branch.months[i] ? branch.months[i].net : 0
      })

      monthlyData.push(monthObj)
    }

    return monthlyData
  }

  // Prepare data for Market Share Chart (pie chart for selected month)
  const prepareMarketShareData = () => {
    const monthData = allData.find(
      (d) => d.year === selectedYear && d.monthNumber === selectedMonth
    )

    if (!monthData) return []

    return monthData.branches
      .map((branch, index) => ({
        branch: branch.branch,
        net: branch.net,
        netPercentage: branch.netPercentage,
        color: branchColors[index % branchColors.length],
      }))
      .sort((a, b) => b.net - a.net)
  }

  const selectedMonthName = 
    allData.find((d) => d.year === selectedYear && d.monthNumber === selectedMonth)?.monthName || ""

  if (loading) {
    return (
      <div>
        <Header
          title="Facturas por Sucursal"
          subtitle="Análisis de ventas por sucursal"
        />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (allData.length === 0 || branchesAnnualData.length === 0) {
    return (
      <div>
        <Header
          title="Facturas por Sucursal"
          subtitle="Análisis de ventas por sucursal"
        />
        <div className="p-6">
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No se encontraron datos</h3>
            <p className="mt-1 text-sm text-gray-500">
              No hay datos de facturas por sucursal disponibles para {selectedYear}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header
        title="Facturas por Sucursal - Análisis Anual"
        subtitle={`Comparativo mensual de ventas por sucursal - Año ${selectedYear}`}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Year Selector */}
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
                className="px-4 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-medium text-gray-900"
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

        {/* Annual Comparison Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[2000px]">
              <thead>
                <tr className="bg-green-600">
                  <th className="px-4 py-5 text-left text-sm font-semibold text-white uppercase tracking-wider sticky left-0 bg-green-600 z-20 min-w-[180px]">
                    Sucursal
                  </th>
                  {monthNames.map((month, index) => (
                    <th
                      key={index}
                      className="px-3 py-5 text-center text-sm font-semibold text-white uppercase tracking-wider border-l border-green-500"
                      colSpan={6}
                    >
                      {month}
                    </th>
                  ))}
                </tr>
                <tr className="bg-green-700">
                  <th className="px-4 py-4 text-sm font-semibold text-white sticky left-0 bg-green-700 z-20"></th>
                  {Array(12).fill(null).map((_, monthIndex) => (
                    <React.Fragment key={`subheaders-${monthIndex}`}>
                      <th className="px-2 py-4 text-xs font-medium text-white border-l border-green-600">Neto</th>
                      <th className="px-2 py-4 text-xs font-medium text-white">%Part</th>
                      <th className="px-2 py-4 text-xs font-medium text-white">Margen</th>
                      <th className="px-2 py-4 text-xs font-medium text-white">%Mrg</th>
                      <th className="px-2 py-4 text-xs font-medium text-white">Desc</th>
                      <th className="px-2 py-4 text-xs font-medium text-white">%Dsc</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {branchesAnnualData.map((branch) => (
                  <tr key={branch.branch} className="hover:bg-green-50 transition-colors">
                    <td className="px-4 py-6 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                      {branch.branch}
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((monthNum) => {
                      const monthData = branch.months[monthNum]
                      return (
                        <React.Fragment key={`${branch.branch}-${monthNum}`}>
                          <td className="px-2 py-6 text-xs text-right text-gray-900 border-l border-gray-200">
                            {monthData ? formatCurrency(monthData.net).replace('$', '').trim() : '-'}
                          </td>
                          <td className="px-2 py-6 text-xs text-right text-gray-700">
                            {monthData ? `${monthData.netPercentage.toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-2 py-6 text-xs text-right text-gray-900">
                            {monthData ? formatCurrency(monthData.margin).replace('$', '').trim() : '-'}
                          </td>
                          <td className="px-2 py-6 text-xs text-right text-gray-700">
                            {monthData ? `${monthData.marginPercentage.toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-2 py-6 text-xs text-right text-gray-900">
                            {monthData ? formatCurrency(monthData.discounts).replace('$', '').trim() : '-'}
                          </td>
                          <td className="px-2 py-6 text-xs text-right text-gray-700">
                            {monthData ? `${monthData.discountsPercentage.toFixed(1)}%` : '-'}
                          </td>
                        </React.Fragment>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Gráficas de Análisis */}
        <div className="space-y-6">
          {/* Gráfica 1: Top Sucursales */}
          <Card>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  📊 Ventas Netas por Sucursal - Comparativo y Tendencias
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Barras apiladas (volumen) + líneas de tendencia (evolución) - {selectedYear}
                </p>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-1">
                    💡 Cómo interpretar:
                  </p>
                  <p className="text-xs text-blue-800">
                    <strong>Barras:</strong> Muestran el volumen y composición de ventas por sucursal en cada mes.
                  </p>
                  <p className="text-xs text-blue-800 mt-1">
                    <strong>Líneas:</strong> Muestran la tendencia y estacionalidad de cada sucursal a lo largo del año.
                  </p>
                </div>
              </div>
              <BranchCombinedChart 
                data={prepareTopSucursalesData()} 
                branches={prepareBranchInfo()}
              />
            </div>
          </Card>

          {/* Gráfica 2: Participación de Mercado (Pie Chart) */}
          <Card>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  🥧 Distribución de Ventas por Sucursal
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Participación porcentual en ventas netas mensuales
                </p>

                {/* Selector de Mes */}
                <div className="mt-3 w-full md:w-1/2">
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Año:
                        </label>
                        <select
                          value={selectedYear}
                          onChange={(e) => {
                            const newYear = Number(e.target.value);
                            setSelectedYear(newYear);
                            // Reset month to first available for new year
                            const monthsForYear = allData
                              .filter((d) => d.year === newYear)
                              .map((d) => d.monthNumber)
                              .sort((a, b) => b - a);
                            if (monthsForYear.length > 0) {
                              setSelectedMonth(monthsForYear[0]);
                            }
                          }}
                          className="w-full px-4 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-medium text-gray-900"
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
                          Mes:
                        </label>
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(Number(e.target.value))}
                          className="w-full px-4 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-medium text-gray-900"
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
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda: Card de Evolución */}
                <div className="lg:col-span-1">
                  <Card>
                    <div className="p-4">
                      <h4 className="text-sm font-bold text-gray-900 mb-3">
                        📊 Resumen - {selectedMonthName} {selectedYear}
                      </h4>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {prepareMarketShareData().map((branch, index) => (
                          <div
                            key={branch.branch}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: branch.color }}
                                />
                                <span className="text-xs font-semibold text-gray-900">
                                  #{index + 1} {branch.branch}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Ventas:</span>
                                <span className="text-xs font-medium text-gray-900">
                                  {formatCurrency(branch.net)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Participación:</span>
                                <span className="text-xs font-bold text-green-600">
                                  {branch.netPercentage.toFixed(2)}%
                                </span>
                              </div>
                              {/* Barra de progreso */}
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${branch.netPercentage}%`,
                                      backgroundColor: branch.color,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Columna Derecha: Gráfico Circular */}
                <div className="lg:col-span-2">
                  {prepareMarketShareData().length > 0 ? (
                    <BranchMarketShareChart data={prepareMarketShareData()} />
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No hay datos disponibles para el mes seleccionado
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

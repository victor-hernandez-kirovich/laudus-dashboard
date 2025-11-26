'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { Building2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { TopSucursalesChart } from '@/components/charts/TopSucursalesChart'

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
        // Select the most recent year by default
        setSelectedYear(result.data[0].year)
      }
    } catch (error) {
      console.error('Error fetching invoices by branch:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get unique years for year selector
  const availableYears = Array.from(new Set(allData.map(d => d.year))).sort((a, b) => b - a)
  
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
                  📊 Comparativo Ventas Netas por Sucursal
                </h3>
               
                
              </div>
              <TopSucursalesChart 
                data={prepareTopSucursalesData()} 
                branches={prepareBranchInfo()}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

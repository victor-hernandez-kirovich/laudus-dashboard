'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { Building2, ChevronDown, ChevronUp } from 'lucide-react'
import { Header } from '@/components/layout/Header'

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

export default function InvoicesByBranchPage() {
  const [allData, setAllData] = useState<InvoicesByBranchData[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(0)
  const [selectedMonthNumber, setSelectedMonthNumber] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

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
        // Select the most recent month by default
        setSelectedYear(result.data[0].year)
        setSelectedMonthNumber(result.data[0].monthNumber)
      }
    } catch (error) {
      console.error('Error fetching invoices by branch:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get unique years for year selector
  const availableYears = Array.from(new Set(allData.map(d => d.year))).sort((a, b) => b - a)
  
  // Get months available for selected year
  const availableMonths = allData
    .filter(d => d.year === selectedYear)
    .sort((a, b) => b.monthNumber - a.monthNumber)
  
  // Find current data based on year and month
  const data = allData.find(d => d.year === selectedYear && d.monthNumber === selectedMonthNumber)

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (allData.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No se encontraron datos</h3>
          <p className="mt-1 text-sm text-gray-500">
            No hay datos de facturas por sucursal disponibles
          </p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Mes no encontrado</h3>
        </div>
      </div>
    )
  }


  // Sort branches by net sales descending
  const sortedBranches = [...data.branches].sort((a, b) => b.net - a.net)

  return (
    <div>
      <Header
        title="Facturas por Sucursal"
        subtitle="Análisis de ventas por sucursal"
      />

      <div className="p-8 space-y-8">
        {/* Year and Month Selector */}
        <div className="flex justify-end">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 inline-block">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Seleccionar:</span>
          
          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => {
              const newYear = Number(e.target.value)
              setSelectedYear(newYear)
              // Set to first available month of new year
              const firstMonth = allData.find(d => d.year === newYear)
              if (firstMonth) {
                setSelectedMonthNumber(firstMonth.monthNumber)
              }
            }}
            className="block w-32 rounded-md border-2 border-gray-400 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 font-medium text-gray-900"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year} 
              </option>
            ))}
          </select>
          
          {/* Month Selector */}
          <select
            value={selectedMonthNumber}
            onChange={(e) => setSelectedMonthNumber(Number(e.target.value))}
            className="block w-40 rounded-md border-2 border-gray-400 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 font-medium text-gray-900"
          >
            {availableMonths.map((item) => (
              <option key={item.monthNumber} value={item.monthNumber}>
                {item.monthName.charAt(0).toUpperCase() + item.monthName.slice(1)} 
              </option>
            ))}
          </select>
        </div>
      </div>
      </div>

      {/* Branches Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full md:min-w-[1200px]">
            <thead>
              <tr className="bg-green-600">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider md:sticky md:left-0 bg-green-600 md:z-10">
                  Sucursal
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                  Ventas Netas
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                  % Participación
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                  Margen
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                  % Margen
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                  Descuentos
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                  % Descuento
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedBranches.map((branch) => (
                <React.Fragment key={branch.branch}>
                  <tr className="hover:bg-blue-50 cursor-pointer transition-colors">
                    <td 
                      className="px-4 py-3 text-sm font-medium text-gray-900 md:sticky md:left-0 bg-white"
                      onClick={() => {
                        const isMobile = window.innerWidth < 768;
                        if (isMobile) {
                          setExpandedRow(expandedRow === branch.branch ? null : branch.branch);
                        }
                      }}
                    >
                      {branch.branch}
                    </td>
                    <td 
                      className="px-4 py-3 text-sm text-gray-900"
                      onClick={() => {
                        const isMobile = window.innerWidth < 768;
                        if (isMobile) {
                          setExpandedRow(expandedRow === branch.branch ? null : branch.branch);
                        }
                      }}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-right">{formatCurrency(branch.net)}</span>
                        <span className="md:hidden">
                          {expandedRow === branch.branch ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell">
                      {branch.netPercentage.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell">
                      {formatCurrency(branch.margin)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell">
                      {branch.marginPercentage.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell">
                      {formatCurrency(branch.discounts)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 hidden md:table-cell">
                      {branch.discountsPercentage.toFixed(2)}%
                    </td>
                  </tr>

                  {/* Fila expandida para mobile */}
                  {expandedRow === branch.branch && (
                    <tr className="md:hidden bg-gray-50">
                      <td colSpan={2} className="px-4 py-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500">% Participación:</span>
                            <span className="text-sm text-gray-900">
                              {branch.netPercentage.toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500">Margen:</span>
                            <span className="text-sm text-gray-900">{formatCurrency(branch.margin)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500">% Margen:</span>
                            <span className="text-sm text-gray-900">
                              {branch.marginPercentage.toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500">Descuentos:</span>
                            <span className="text-sm text-gray-900">{formatCurrency(branch.discounts)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500">% Descuento:</span>
                            <span className="text-sm text-gray-900">
                              {branch.discountsPercentage.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}

              {/* Fila de Totales */}
              <tr className="bg-green-100 border-t-2 border-green-300">
                <td className="px-4 py-4 text-sm text-gray-900 uppercase font-bold md:sticky md:left-0 bg-green-100">
                  Total {data.monthName} {data.year}
                </td>
                <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold">
                  {formatCurrency(data.totalNet)}
                </td>
                <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                  100.00%
                </td>
                <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                  {formatCurrency(data.totalMargin)}
                </td>
                <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                  {data.avgMarginPercentage.toFixed(2)}%
                </td>
                <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                  {formatCurrency(data.totalDiscounts)}
                </td>
                <td className="px-4 py-4 text-sm text-right text-gray-900 font-bold hidden md:table-cell">
                  {data.avgDiscountPercentage.toFixed(2)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      </div>
    </div>
  )
}

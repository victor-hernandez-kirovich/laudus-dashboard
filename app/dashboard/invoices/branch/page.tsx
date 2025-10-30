'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { Building2, TrendingUp, DollarSign, Tag } from 'lucide-react'
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Neto</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.totalNet)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Margen</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.totalMargin)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Promedio: {data.avgMarginPercentage.toFixed(2)}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Descuentos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.totalDiscounts)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Promedio: {data.avgDiscountPercentage.toFixed(2)}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Tag className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sucursales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.branchCount}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Branches Table */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Detalle por Sucursal</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sucursal
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ventas Netas
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Participación
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margen
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Margen
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descuentos
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Descuento
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedBranches.map((branch) => (
                <tr key={branch.branch} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {branch.branch}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                    {formatCurrency(branch.net)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {branch.netPercentage.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(branch.margin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      branch.marginPercentage >= 20 
                        ? 'bg-green-100 text-green-800' 
                        : branch.marginPercentage >= 10
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {branch.marginPercentage.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(branch.discounts)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {branch.discountsPercentage.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, Fragment } from 'react'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { Building2, TrendingUp, TrendingDown, DollarSign, Percent, Tag, ChevronDown, ChevronUp, Calendar } from 'lucide-react'

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
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null)

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
        setSelectedMonth(result.data[0].month)
      }
    } catch (error) {
      console.error('Error fetching invoices by branch:', error)
    } finally {
      setLoading(false)
    }
  }

  const data = allData.find(d => d.month === selectedMonth)

  const toggleBranch = (branchName: string) => {
    setExpandedBranch(expandedBranch === branchName ? null : branchName)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

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
    <div className="p-6 space-y-6">
      {/* Header with Month Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturas por Sucursal</h1>
          <p className="mt-1 text-sm text-gray-500">
            Análisis de ventas por sucursal
          </p>
        </div>
        
        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {allData.map((item) => (
              <option key={item.month} value={item.month}>
                {item.monthName} {item.year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Period Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Período:</strong> {formatDate(data.startDate)} - {formatDate(data.endDate)}
        </p>
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
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedBranches.map((branch) => (
                <Fragment key={branch.branch}>
                  <tr className="hover:bg-gray-50">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button
                        onClick={() => toggleBranch(branch.branch)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {expandedBranch === branch.branch ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                  {expandedBranch === branch.branch && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-gray-600">Ventas Netas</p>
                                <p className="text-lg font-bold text-blue-900 mt-1">
                                  {formatCurrency(branch.net)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {branch.netPercentage.toFixed(2)}% del total
                                </p>
                              </div>
                              <DollarSign className="h-8 w-8 text-blue-600" />
                            </div>
                          </Card>

                          <Card>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-gray-600">Margen</p>
                                <p className="text-lg font-bold text-green-900 mt-1">
                                  {formatCurrency(branch.margin)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {branch.marginPercentage.toFixed(2)}% de las ventas
                                </p>
                              </div>
                              <TrendingUp className="h-8 w-8 text-green-600" />
                            </div>
                          </Card>

                          <Card>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-gray-600">Descuentos</p>
                                <p className="text-lg font-bold text-orange-900 mt-1">
                                  {formatCurrency(branch.discounts)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {branch.discountsPercentage.toFixed(2)}% de las ventas
                                </p>
                              </div>
                              <Tag className="h-8 w-8 text-orange-600" />
                            </div>
                          </Card>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top 5 Sucursales por Ventas</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {sortedBranches.slice(0, 5).map((branch, index) => (
                <div key={branch.branch} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{branch.branch}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(branch.net)}</p>
                    <p className="text-xs text-gray-500">{branch.netPercentage.toFixed(2)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top 5 Sucursales por Margen %</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[...sortedBranches]
                .sort((a, b) => b.marginPercentage - a.marginPercentage)
                .slice(0, 5)
                .map((branch, index) => (
                  <div key={branch.branch} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 font-semibold text-sm">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{branch.branch}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{branch.marginPercentage.toFixed(2)}%</p>
                      <p className="text-xs text-gray-500">{formatCurrency(branch.margin)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

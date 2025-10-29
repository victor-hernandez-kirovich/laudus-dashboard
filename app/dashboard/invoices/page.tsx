'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { 
  DollarSign, 
  FileText, 
  Calendar, 
  TrendingUp,
  Package,
  ChevronDown,
  ChevronRight,
  BarChart3
} from 'lucide-react'

interface InvoiceData {
  month: string
  year: number
  monthNumber: number
  monthName: string
  total: number
  returns: number
  returnsPercentage: number
  net: number
  netChangeYoYPercentage: number
  margin: number
  marginChangeYoYPercentage: number
  discounts: number
  discountsPercentage: number
  quantity: number
  insertedAt: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())

  const toggleMonth = (month: string) => {
    const newExpanded = new Set(expandedMonths)
    if (newExpanded.has(month)) {
      newExpanded.delete(month)
    } else {
      newExpanded.add(month)
    }
    setExpandedMonths(newExpanded)
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data/invoices')
        if (!res.ok) throw new Error('Error al cargar datos')
        const result = await res.json()
        setInvoices(result.data)
        // Seleccionar el mes más reciente por defecto
        if (result.data && result.data.length > 0) {
          setSelectedMonth(result.data[0].month)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div>
        <Header title='Facturas Mensuales' subtitle='Reporte de ventas por mes' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-600'>Cargando datos...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Header title='Facturas Mensuales' subtitle='Reporte de ventas por mes' />
        <div className='p-8'>
          <Card>
            <div className='text-red-600'>Error: {error}</div>
          </Card>
        </div>
      </div>
    )
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div>
        <Header title='Facturas Mensuales' subtitle='No hay datos disponibles' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-500'>No se encontraron facturas</div>
        </div>
      </div>
    )
  }

  // Calcular totales generales
  const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalNet = invoices.reduce((sum, inv) => sum + inv.net, 0)
  const totalQuantity = invoices.reduce((sum, inv) => sum + inv.quantity, 0)
  const avgMonthly = totalSales / invoices.length
  const avgMargin = invoices.reduce((sum, inv) => sum + inv.margin, 0) / invoices.length

  // Obtener datos del mes seleccionado
  const selectedData = invoices.find(inv => inv.month === selectedMonth)

  // Formatear nombre del mes
  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${months[parseInt(month) - 1]} ${year}`
  }

  return (
    <div>
      <Header
        title='Facturas Mensuales'
        subtitle='Análisis de ventas agregadas por mes - Enero a Octubre 2025'
      />

      <div className='p-8 space-y-8'>
        {/* Selector de Mes */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <div className='p-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
              <div className='flex items-center gap-2'>
                <Calendar className='h-5 w-5 text-blue-600' />
                <label className='text-sm font-medium text-gray-700'>
                  Seleccionar Mes:
                </label>
              </div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
              >
                {invoices.map(inv => (
                  <option key={inv.month} value={inv.month}>
                    {formatMonthName(inv.month)}
                  </option>
                ))}
              </select>
            </div>
            <div className='mt-2 text-xs text-gray-500'>
              {invoices.length} meses disponibles
            </div>
          </div>
        </div>

        {/* Resumen General */}
        <div>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>Resumen General (Todos los Meses)</h2>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-4'>
            <Card>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Total Bruto</p>
                  <p className='text-2xl font-bold text-green-600 mt-1'>
                    {formatCurrency(totalSales)}
                  </p>
                </div>
                <DollarSign className='h-8 w-8 text-green-500' />
              </div>
            </Card>

            <Card>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Total Neto</p>
                  <p className='text-2xl font-bold text-blue-600 mt-1'>
                    {formatCurrency(totalNet)}
                  </p>
                </div>
                <FileText className='h-8 w-8 text-blue-500' />
              </div>
            </Card>

            <Card>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Cantidad Items</p>
                  <p className='text-2xl font-bold text-purple-600 mt-1'>
                    {totalQuantity.toLocaleString('es-CL')}
                  </p>
                </div>
                <Package className='h-8 w-8 text-purple-500' />
              </div>
            </Card>

            <Card>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Margen Promedio</p>
                  <p className='text-2xl font-bold text-orange-600 mt-1'>
                    {avgMargin.toFixed(1)}%
                  </p>
                </div>
                <BarChart3 className='h-8 w-8 text-orange-500' />
              </div>
            </Card>
          </div>
        </div>

        {/* Detalle del Mes Seleccionado */}
        {selectedData && (
          <div>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Detalle de {formatMonthName(selectedMonth)}
            </h2>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <Card>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Ventas Brutas</p>
                  <p className='text-3xl font-bold text-green-600 mt-2'>
                    {formatCurrency(selectedData.total)}
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>
                    Neto: {formatCurrency(selectedData.net)}
                  </p>
                  {selectedData.netChangeYoYPercentage !== 0 && (
                    <p className='text-xs text-blue-600 mt-1'>
                      {selectedData.netChangeYoYPercentage > 0 ? '↑' : '↓'} {Math.abs(selectedData.netChangeYoYPercentage).toFixed(1)}% vs año anterior
                    </p>
                  )}
                </div>
              </Card>

              <Card>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Margen</p>
                  <p className='text-3xl font-bold text-purple-600 mt-2'>
                    {selectedData.margin.toFixed(1)}%
                  </p>
                  {selectedData.marginChangeYoYPercentage !== 0 && (
                    <p className='text-xs text-blue-600 mt-1'>
                      {selectedData.marginChangeYoYPercentage > 0 ? '↑' : '↓'} {Math.abs(selectedData.marginChangeYoYPercentage).toFixed(1)}% vs año anterior
                    </p>
                  )}
                  <p className='text-xs text-gray-500 mt-2'>
                    Cantidad: {selectedData.quantity.toLocaleString('es-CL')}
                  </p>
                </div>
              </Card>

              <Card>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Devoluciones</p>
                  <p className='text-3xl font-bold text-red-600 mt-2'>
                    {formatCurrency(selectedData.returns)}
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>
                    {selectedData.returnsPercentage.toFixed(1)}% del total
                  </p>
                  <p className='text-xs text-gray-500 mt-2'>
                    Descuentos: {formatCurrency(selectedData.discounts)} ({selectedData.discountsPercentage.toFixed(1)}%)
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tabla Mensual Comparativa */}
        <Card title='Comparativo Mensual' subtitle='Ventas agregadas por cada mes'>
          <div className='overflow-x-auto max-h-[600px] overflow-y-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50 sticky top-0 z-10 shadow-sm'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50'>
                    Mes
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50'>
                    Total Bruto
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50'>
                    Total Neto
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50'>
                    Margen %
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50'>
                    Cantidad
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50'>
                    Devoluciones
                  </th>
                  <th className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50'>
                    Detalle
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {invoices.map((invoice) => (
                  <>
                    <tr key={invoice.month} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                        {formatMonthName(invoice.month)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-700'>
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-700'>
                        {formatCurrency(invoice.net)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-right text-purple-700 font-medium'>
                        {invoice.margin.toFixed(1)}%
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900'>
                        {invoice.quantity.toLocaleString('es-CL')}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-right text-red-700'>
                        {formatCurrency(invoice.returns)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-center'>
                        <button
                          onClick={() => toggleMonth(invoice.month)}
                          className='text-blue-600 hover:text-blue-800'
                        >
                          {expandedMonths.has(invoice.month) ? (
                            <ChevronDown className='h-5 w-5 inline' />
                          ) : (
                            <ChevronRight className='h-5 w-5 inline' />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedMonths.has(invoice.month) && (
                      <tr className='bg-gray-50'>
                        <td colSpan={7} className='px-6 py-4'>
                          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                            <div>
                              <span className='text-gray-600 font-medium'>Descuentos:</span>
                              <div className='text-orange-700 font-semibold'>
                                {formatCurrency(invoice.discounts)} ({invoice.discountsPercentage.toFixed(1)}%)
                              </div>
                            </div>
                            <div>
                              <span className='text-gray-600 font-medium'>% Devoluciones:</span>
                              <div className='text-red-700 font-semibold'>
                                {invoice.returnsPercentage.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <span className='text-gray-600 font-medium'>Cambio Neto YoY:</span>
                              <div className={`font-semibold ${invoice.netChangeYoYPercentage >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {invoice.netChangeYoYPercentage >= 0 ? '↑' : '↓'} {Math.abs(invoice.netChangeYoYPercentage).toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <span className='text-gray-600 font-medium'>Cambio Margen YoY:</span>
                              <div className={`font-semibold ${invoice.marginChangeYoYPercentage >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {invoice.marginChangeYoYPercentage >= 0 ? '↑' : '↓'} {Math.abs(invoice.marginChangeYoYPercentage).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

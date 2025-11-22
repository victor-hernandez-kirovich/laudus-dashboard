'use client'

import { useState, useEffect, Fragment } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { MonthPicker } from '@/components/ui/MonthPicker'
// Charts removed per request
import { formatCurrency, formatDate, normalizeBalanceData } from '@/lib/utils'
import { Calendar, ChevronDown, ChevronRight, LayoutGrid, Table as TableIcon } from 'lucide-react'

// Componente para visualizar el Balance General
const BalanceGeneralView = ({ data }: { data: any }) => {
  if (!data) return <div className="p-4 text-center text-gray-500">No hay datos de Balance General para esta fecha. Ejecute el script de generación.</div>

  const { assets, liabilities, equity, totals } = data

  const AccountList = ({ items, colorClass = "text-gray-900" }: { items: any[], colorClass?: string }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cuenta</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item: any, idx: number) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-3 py-2 text-xs font-medium text-gray-500">{item.accountCode}</td>
              <td className="px-3 py-2 text-xs text-gray-900">{item.accountName}</td>
              <td className={`px-3 py-2 text-xs text-right font-medium ${colorClass}`}>
                {formatCurrency(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda: Activos */}
        <div className="space-y-6">
          <Card title="Activos" subtitle={`Total: ${formatCurrency(totals?.total_assets || 0)}`}>
            <div className="max-h-[600px] overflow-y-auto">
              <AccountList items={assets} colorClass="text-blue-700" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center bg-blue-50 p-3 rounded-md">
              <span className="font-bold text-blue-900">Total Activos</span>
              <span className="font-bold text-blue-700 text-lg">{formatCurrency(totals?.total_assets || 0)}</span>
            </div>
          </Card>
        </div>

        {/* Columna Derecha: Pasivos y Patrimonio */}
        <div className="space-y-6">
          <Card title="Pasivos" subtitle={`Total: ${formatCurrency(totals?.total_liabilities || 0)}`}>
            <div className="max-h-[250px] overflow-y-auto">
              <AccountList items={liabilities} colorClass="text-red-700" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center bg-red-50 p-3 rounded-md">
              <span className="font-bold text-red-900">Total Pasivos</span>
              <span className="font-bold text-red-700 text-lg">{formatCurrency(totals?.total_liabilities || 0)}</span>
            </div>
          </Card>

          <Card title="Patrimonio" subtitle={`Total: ${formatCurrency(totals?.total_equity || 0)}`}>
            <div className="max-h-[250px] overflow-y-auto">
              <AccountList items={equity} colorClass="text-green-700" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center bg-green-50 p-3 rounded-md">
              <span className="font-bold text-green-900">Total Patrimonio</span>
              <span className="font-bold text-green-700 text-lg">{formatCurrency(totals?.total_equity || 0)}</span>
            </div>
          </Card>

          {/* Resumen de Cuadratura */}
          <Card className="bg-gray-50 border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total Pasivos + Patrimonio</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency((totals?.total_liabilities || 0) + (totals?.total_equity || 0))}
              </span>
            </div>
            {Math.abs(totals?.balance_check || 0) > 0.01 && (
              <div className="mt-2 text-xs text-red-600 font-bold text-right">
                Diferencia: {formatCurrency(totals?.balance_check || 0)}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function Balance8ColumnsPage() {
  const [allData, setAllData] = useState<any[]>([])
  const [generalData, setGeneralData] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadingGeneral, setLoadingGeneral] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [activeTab, setActiveTab] = useState<'8columns' | 'general'>('8columns')

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  // Fetch 8 Columns Data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data/8columns')
        if (!res.ok) throw new Error('Error al cargar datos')
        const result = await res.json()
        setAllData(result.data)
        // Seleccionar la fecha más reciente por defecto
        if (result.data && result.data.length > 0 && !selectedDate) {
          setSelectedDate(result.data[0].date)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Fetch General Balance Data when tab or date changes
  useEffect(() => {
    async function fetchGeneralData() {
      if (activeTab === 'general' && selectedDate) {
        setLoadingGeneral(true)
        try {
          const res = await fetch(`/api/data/balance-general?date=${selectedDate}`)
          if (res.ok) {
            const result = await res.json()
            // Find the record for the specific date or take the first one if filtered by API
            const record = result.data && result.data.length > 0 ? result.data[0] : null
            setGeneralData(record)
          }
        } catch (err) {
          console.error("Error fetching balance general", err)
        } finally {
          setLoadingGeneral(false)
        }
      }
    }
    fetchGeneralData()
  }, [activeTab, selectedDate])

  if (loading) {
    return (
      <div>
        <Header title='Balance Financiero' subtitle='Cargando datos...' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-600 animate-pulse'>Cargando datos...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Header title='Balance Financiero' subtitle='Error' />
        <div className='p-8'>
          <Card>
            <div className='text-red-600'>Error: {error}</div>
          </Card>
        </div>
      </div>
    )
  }

  if (!allData || allData.length === 0) {
    return (
      <div>
        <Header title='Balance Financiero' subtitle='No hay datos disponibles' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-500'>No se encontraron datos</div>
        </div>
      </div>
    )
  }

  // Buscar el registro que corresponde a la fecha seleccionada
  const latestRecord = allData.find(record => record.date === selectedDate) || allData[0]
  const records = latestRecord?.data || []
  const availableDates = allData.map(record => record.date)

  return (
    <div>
      <Header
        title='Balance Financiero'
        subtitle='Análisis contable y financiero'
      />

      <div className='p-8 space-y-6'>
        {/* Controles Superiores */}
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>

          {/* Selector de Pestañas */}
          <div className="bg-gray-100 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setActiveTab('8columns')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === '8columns'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
            >
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4" />
                Balance 8 Columnas
              </div>
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'general'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
            >
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                Balance General
              </div>
            </button>
          </div>

          {/* Selector de Mes */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 inline-flex'>
            <div className='p-2 px-4'>
              <div className='flex items-center gap-3'>
                <Calendar className='h-5 w-5 text-blue-600' />
                <span className='text-sm font-medium text-gray-700'>
                  Periodo:
                </span>
                <MonthPicker
                  availableDates={availableDates}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        {activeTab === '8columns' ? (
          <Card title='Detalle 8 Columnas' subtitle={`Total: ${records.length} cuentas contables`}>
            <div className='overflow-x-auto max-h-[600px] overflow-y-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50 sticky top-0 z-10 shadow-sm'>
                  <tr>
                    <th className='hidden md:table-cell px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50'>
                      Código
                    </th>
                    <th className='hidden md:table-cell px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50'>
                      Nombre
                    </th>
                    <th className='hidden md:table-cell px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase bg-gray-50'>
                      Debe
                    </th>
                    <th className='hidden md:table-cell px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase bg-gray-50'>
                      Haber
                    </th>
                    <th className='hidden md:table-cell px-2 py-2 text-right text-xs font-medium text-blue-600 uppercase bg-gray-50'>
                      Bal.Deud
                    </th>
                    <th className='hidden md:table-cell px-2 py-2 text-right text-xs font-medium text-red-600 uppercase bg-gray-50'>
                      Bal.Acree
                    </th>
                    <th className='hidden lg:table-cell px-2 py-2 text-right text-xs font-medium text-blue-600 uppercase bg-gray-50'>
                      Activos
                    </th>
                    <th className='hidden lg:table-cell px-2 py-2 text-right text-xs font-medium text-red-600 uppercase bg-gray-50'>
                      Pasivos
                    </th>
                    <th className='hidden lg:table-cell px-2 py-2 text-right text-xs font-medium text-orange-600 uppercase bg-gray-50'>
                      Gastos
                    </th>
                    <th className='hidden lg:table-cell px-2 py-2 text-right text-xs font-medium text-green-600 uppercase bg-gray-50'>
                      Ingresos
                    </th>
                    <th className='md:hidden px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50'>
                      Cuenta
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {records.map(normalizeBalanceData).map((record: any, index: number) => (
                    <Fragment key={index}>
                      {/* Fila principal */}
                      <tr className='hover:bg-gray-50'>
                        {/* Desktop: TODAS las 10 columnas (solo DB) */}
                        <td className='hidden md:table-cell px-2 py-3 whitespace-nowrap text-xs font-medium text-gray-900'>
                          {record.accountCode}
                        </td>
                        <td className='hidden md:table-cell px-2 py-3 text-xs text-gray-900'>
                          {record.accountName}
                        </td>
                        <td className='hidden md:table-cell px-2 py-3 whitespace-nowrap text-xs text-right text-gray-900'>
                          {formatCurrency(record.debit || 0)}
                        </td>
                        <td className='hidden md:table-cell px-2 py-3 whitespace-nowrap text-xs text-right text-gray-900'>
                          {formatCurrency(record.credit || 0)}
                        </td>
                        <td className='hidden md:table-cell px-2 py-3 whitespace-nowrap text-xs text-right text-blue-700 font-medium'>
                          {formatCurrency(record.debitBalance || 0)}
                        </td>
                        <td className='hidden md:table-cell px-2 py-3 whitespace-nowrap text-xs text-right text-red-700 font-medium'>
                          {formatCurrency(record.creditBalance || 0)}
                        </td>
                        <td className='hidden lg:table-cell px-2 py-3 whitespace-nowrap text-xs text-right text-blue-700 font-medium'>
                          {formatCurrency(record.assets || 0)}
                        </td>
                        <td className='hidden lg:table-cell px-2 py-3 whitespace-nowrap text-xs text-right text-red-700 font-medium'>
                          {formatCurrency(record.liabilities || 0)}
                        </td>
                        <td className='hidden lg:table-cell px-2 py-3 whitespace-nowrap text-xs text-right text-orange-700 font-medium'>
                          {formatCurrency(record.expenses || 0)}
                        </td>
                        <td className='hidden lg:table-cell px-2 py-3 whitespace-nowrap text-xs text-right text-green-700 font-medium'>
                          {formatCurrency(record.incomes || 0)}
                        </td>

                        {/* Mobile: Solo Código-Nombre clickeable */}
                        <td
                          className='md:hidden px-4 py-4 cursor-pointer'
                          onClick={() => toggleRow(index)}
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex-1 min-w-0'>
                              <div className='text-sm font-medium text-gray-900'>
                                {record.accountCode} - {record.accountName}
                              </div>
                            </div>
                            <div className='ml-3 flex-shrink-0'>
                              {expandedRows.has(index) ? (
                                <ChevronDown className='h-5 w-5 text-gray-400' />
                              ) : (
                                <ChevronRight className='h-5 w-5 text-gray-400' />
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Fila expandida (solo mobile) - TODAS las 10 COLUMNAS */}
                      {expandedRows.has(index) && (
                        <tr key={`expanded-${index}`} className='md:hidden bg-gray-50'>
                          <td colSpan={11} className='px-4 py-4'>
                            <div className='space-y-2 text-sm'>
                              <div className='flex justify-between items-center'>
                                <span className='text-gray-600 font-medium'>Código:</span>
                                <span className='text-gray-900 font-semibold'>{record.accountCode}</span>
                              </div>
                              <div className='flex justify-between items-center'>
                                <span className='text-gray-600 font-medium'>Nombre:</span>
                                <span className='text-gray-900 text-right text-xs'>{record.accountName}</span>
                              </div>
                              <div className='border-t border-gray-200 my-2'></div>
                              <div className='flex justify-between items-center'>
                                <span className='text-gray-600 font-medium'>Debe:</span>
                                <span className='text-gray-900'>{formatCurrency(record.debit || 0)}</span>
                              </div>
                              <div className='flex justify-between items-center'>
                                <span className='text-gray-600 font-medium'>Haber:</span>
                                <span className='text-gray-900'>{formatCurrency(record.credit || 0)}</span>
                              </div>
                              <div className='border-t-2 border-gray-300 my-3'></div>
                              <div className='flex justify-between items-center'>
                                <span className='text-blue-700 font-medium'>Balance Deudor:</span>
                                <span className='text-blue-700 font-semibold'>{formatCurrency(record.debitBalance || 0)}</span>
                              </div>
                              <div className='flex justify-between items-center'>
                                <span className='text-red-700 font-medium'>Balance Acreedor:</span>
                                <span className='text-red-700 font-semibold'>{formatCurrency(record.creditBalance || 0)}</span>
                              </div>
                              <div className='border-t-2 border-gray-300 my-3'></div>
                              <div className='text-xs font-semibold text-gray-500 uppercase mb-2'>Categorías</div>
                              <div className='flex justify-between items-center'>
                                <span className='text-blue-700 font-medium'>Activos:</span>
                                <span className='text-blue-700 font-semibold'>{formatCurrency(record.assets || 0)}</span>
                              </div>
                              <div className='flex justify-between items-center'>
                                <span className='text-red-700 font-medium'>Pasivos:</span>
                                <span className='text-red-700 font-semibold'>{formatCurrency(record.liabilities || 0)}</span>
                              </div>
                              <div className='flex justify-between items-center'>
                                <span className='text-orange-700 font-medium'>Gastos:</span>
                                <span className='text-orange-700 font-semibold'>{formatCurrency(record.expenses || 0)}</span>
                              </div>
                              <div className='flex justify-between items-center'>
                                <span className='text-green-700 font-medium'>Ingresos:</span>
                                <span className='text-green-700 font-semibold'>{formatCurrency(record.incomes || 0)}</span>
                              </div>
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
        ) : (
          // Vista Balance General
          loadingGeneral ? (
            <div className="p-12 flex justify-center">
              <div className="text-gray-500 animate-pulse">Cargando Balance General...</div>
            </div>
          ) : (
            <BalanceGeneralView data={generalData} />
          )
        )}
      </div>
    </div>
  )
}
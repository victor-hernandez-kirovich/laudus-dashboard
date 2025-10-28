'use client'

import { useState, useEffect, Fragment } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { DatePicker } from '@/components/ui/DatePicker'
// Charts removed per request
import { formatCurrency, formatDate, normalizeBalanceData } from '@/lib/utils'
import { Activity, TrendingUp, Calendar, ChevronDown, ChevronRight } from 'lucide-react'

export default function BalanceStandardPage() {
  const [allData, setAllData] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data/standard')
        if (!res.ok) throw new Error('Error al cargar datos')
        const result = await res.json()
        setAllData(result.data)
        // Seleccionar la fecha más reciente por defecto
        if (result.data && result.data.length > 0) {
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

  if (loading) {
    return (
      <div>
        <Header title='Balance Standard' subtitle='Análisis de cuentas estándar' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-600'>Cargando datos...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Header title='Balance Standard' subtitle='Análisis de cuentas estándar' />
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
        <Header title='Balance Standard' subtitle='No hay datos disponibles' />
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
        title='Balance Standard'
        subtitle='Análisis detallado de cuentas estándar'
      />

      <div className='p-8 space-y-8'>
        {/* Selector de Fechas con Calendario */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <div className='p-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
              <div className='flex items-center gap-2 flex-shrink-0'>
                <Calendar className='h-5 w-5 text-blue-600' />
                <label className='text-sm font-medium text-gray-700'>
                  Seleccionar Fecha del Balance:
                </label>
              </div>
              <DatePicker
                availableDates={availableDates}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>
            {allData.length > 1 && (
              <div className='mt-2 text-xs text-gray-500'>
                {allData.length} fechas disponibles en el histórico
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          <Card>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Registros</p>
                <p className='text-2xl font-bold text-gray-900 mt-1'>{records.length}</p>
              </div>
              <Activity className='h-8 w-8 text-green-500' />
            </div>
          </Card>

          <Card>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Fecha de Datos</p>
                <p className='text-2xl font-bold text-gray-900 mt-1'>
                  {latestRecord?.date ? latestRecord.date.split('-').reverse().join('/') : 'N/A'}
                </p>
              </div>
              <Calendar className='h-8 w-8 text-blue-500' />
            </div>
          </Card>

          <Card>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Última Actualización</p>
                <p className='text-lg font-bold text-gray-900 mt-1'>
                  {latestRecord?.insertedAt ? new Date(latestRecord.insertedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                </p>
              </div>
              <TrendingUp className='h-8 w-8 text-purple-500' />
            </div>
          </Card>
        </div>

        {/* Charts removed as requested */}

        {/* Data Table */}
        <Card title='Datos del Balance Standard' subtitle={`Total: ${records.length} registros`}>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Código
                  </th>
                  <th className='hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Nombre de Cuenta
                  </th>
                  <th className='hidden md:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Debe
                  </th>
                  <th className='hidden md:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Haber
                  </th>
                  <th className='hidden md:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Balance
                  </th>
                  <th className='md:hidden px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Cuenta
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {records.map(normalizeBalanceData).map((record: any, index: number) => (
                  <Fragment key={index}>
                    <tr className='hover:bg-gray-50'>
                      <td className='hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                        {record.accountCode}
                      </td>
                      <td className='hidden md:table-cell px-6 py-4 text-sm text-gray-900'>
                        {record.accountName}
                      </td>
                      <td className='hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900'>
                        {formatCurrency(record.debit)}
                      </td>
                      <td className='hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900'>
                        {formatCurrency(record.credit)}
                      </td>
                      <td className='hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900'>
                        {formatCurrency(record.balance)}
                      </td>
                      <td
                        className='md:hidden px-4 py-4 cursor-pointer'
                        onClick={() => toggleRow(index)}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex-1 min-w-0'>
                            <div className='text-sm font-medium text-gray-900'>
                              {record.accountCode} - {record.accountName}
                            </div>
                            <div className='text-xs text-gray-500 mt-1'>
                              Balance: {formatCurrency(record.balance)}
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
                    {expandedRows.has(index) && (
                      <tr key={`expanded-${index}`} className='md:hidden bg-gray-50'>
                        <td colSpan={6} className='px-4 py-4'>
                          <div className='space-y-3 text-sm'>
                            <div className='flex justify-between items-center'>
                              <span className='text-gray-600 font-medium'>Código:</span>
                              <span className='text-gray-900 font-semibold'>{record.accountCode}</span>
                            </div>
                            <div className='flex justify-between items-center'>
                              <span className='text-gray-600 font-medium'>Debe:</span>
                              <span className='text-gray-900'>{formatCurrency(record.debit)}</span>
                            </div>
                            <div className='flex justify-between items-center'>
                              <span className='text-gray-600 font-medium'>Haber:</span>
                              <span className='text-gray-900'>{formatCurrency(record.credit)}</span>
                            </div>
                            <div className='flex justify-between items-center border-t pt-3'>
                              <span className='text-gray-900 font-bold'>Balance Total:</span>
                              <span className='text-lg font-bold text-green-600'>
                                {formatCurrency(record.balance)}
                              </span>
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
      </div>
    </div>
  )
}

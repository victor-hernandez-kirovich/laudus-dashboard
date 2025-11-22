'use client'

import { useState, useEffect, Fragment } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { MonthPicker } from '@/components/ui/MonthPicker'
import { formatCurrency } from '@/lib/utils'
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react'

export default function BalanceGeneralPage() {
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
                const res = await fetch('/api/data/balance-general')
                if (!res.ok) throw new Error('Error al cargar datos')
                const result = await res.json()

                setAllData(result.data || [])
                if (result.data && result.data.length > 0) {
                    setSelectedDate(result.data[0].date)
                }
            } catch (err) {
                console.error('Error fetching balance general:', err)
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
                <Header title='Balance General' subtitle='Cargando datos...' />
                <div className='p-8 flex items-center justify-center'>
                    <div className='text-gray-600 animate-pulse'>Cargando datos...</div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div>
                <Header title='Balance General' subtitle='Error' />
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
                <Header title='Balance General' subtitle='No hay datos disponibles' />
                <div className='p-8'>
                    <Card>
                        <div className='text-center py-12'>
                            <p className='text-gray-500 mb-4'>No se encontraron datos de Balance General.</p>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    const currentRecord = allData.find(record => record.date === selectedDate) || allData[0]
    const availableDates = allData.map(record => record.date)

    if (!currentRecord) {
        return (
            <div>
                <Header title='Balance General' subtitle='Sin datos' />
                <div className='p-8'>
                    <Card>
                        <div className='text-gray-500'>No hay datos para la fecha seleccionada</div>
                    </Card>
                </div>
            </div>
        )
    }

    const { assets = [], liabilities = [], equity = [], totals = {} } = currentRecord

    // Crear lista de todas las cuentas individuales
    const allAccounts: any[] = []

    // Agregar todas las cuentas de activos (cada una en su propia fila)
    assets.forEach((asset: any) => {
        allAccounts.push({
            accountCode: asset.accountCode,
            accountName: asset.accountName,
            assetAmount: asset.amount,
            liabilityAmount: 0
        })
    })

    // Agregar todas las cuentas de pasivos (cada una en su propia fila)
    liabilities.forEach((liability: any) => {
        allAccounts.push({
            accountCode: liability.accountCode,
            accountName: liability.accountName,
            assetAmount: 0,
            liabilityAmount: liability.amount
        })
    })

    // Agregar patrimonio
    equity.forEach((eq: any) => {
        allAccounts.push({
            accountCode: eq.accountCode,
            accountName: eq.accountName,
            assetAmount: 0,
            liabilityAmount: eq.amount
        })
    })

    // Ordenar por código de cuenta
    allAccounts.sort((a, b) => (a.accountCode || '').localeCompare(b.accountCode || ''));
    if (allAccounts.length > 0)

        return (
            <div>
                <Header
                    title='Balance General'
                    subtitle={`Estado de situación financiera - ${selectedDate}`}
                />

                <div className='p-8 space-y-6'>
                    {/* Selector de Mes */}
                    <div className='flex justify-end'>
                        <div className='bg-white rounded-lg shadow-sm border border-gray-200 inline-flex'>
                            <div className='p-4'>
                                <div className='flex items-center gap-3'>
                                    <Calendar className='h-5 w-5 text-blue-600' />
                                    <span className='text-sm font-medium text-gray-700'>
                                        Seleccionar Mes:
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

                    {/* Resumen de Totales */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                            <div className="text-center">
                                <p className="text-sm font-medium text-blue-600">Total Activos</p>
                                <p className="text-2xl font-bold text-blue-900 mt-1">
                                    {formatCurrency(totals?.total_assets || 0)}
                                </p>
                            </div>
                        </Card>

                        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                            <div className="text-center">
                                <p className="text-sm font-medium text-red-600">Total Pasivos</p>
                                <p className="text-2xl font-bold text-red-900 mt-1">
                                    {formatCurrency(totals?.total_liabilities || 0)}
                                </p>
                            </div>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                            <div className="text-center">
                                <p className="text-sm font-medium text-green-600">Patrimonio</p>
                                <p className="text-2xl font-bold text-green-900 mt-1">
                                    {formatCurrency(totals?.total_equity || 0)}
                                </p>
                            </div>
                        </Card>
                    </div>

                    {/* Tabla de Balance General */}
                    <Card title='Balance General' subtitle={`Total: ${allAccounts.length} cuentas`}>
                        <div className='overflow-x-auto max-h-[600px] overflow-y-auto'>
                            <table className='min-w-full divide-y divide-gray-200'>
                                <thead className='bg-gray-50 sticky top-0 z-10 shadow-sm'>
                                    <tr>
                                        <th className='hidden md:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50'>
                                            Código
                                        </th>
                                        <th className='hidden md:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50'>
                                            Nombre de cuenta
                                        </th>
                                        <th className='hidden md:table-cell px-3 py-2 text-right text-xs font-medium text-blue-600 uppercase bg-gray-50'>
                                            Activo
                                        </th>
                                        <th className='hidden md:table-cell px-3 py-2 text-right text-xs font-medium text-red-600 uppercase bg-gray-50'>
                                            Pasivo
                                        </th>
                                        <th className='md:hidden px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50'>
                                            Cuenta
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                    {allAccounts.map((account: any, index: number) => (
                                        <Fragment key={index}>
                                            <tr className='hover:bg-gray-50'>
                                                {/* Desktop */}
                                                <td className='hidden md:table-cell px-3 py-3 whitespace-nowrap text-xs font-medium text-gray-900'>
                                                    {account.accountCode}
                                                </td>
                                                <td className='hidden md:table-cell px-3 py-3 text-xs text-gray-900'>
                                                    {account.accountName}
                                                </td>
                                                <td className='hidden md:table-cell px-3 py-3 whitespace-nowrap text-xs text-right text-blue-700 font-medium'>
                                                    {account.assetAmount > 0 ? formatCurrency(account.assetAmount) : '-'}
                                                </td>
                                                <td className='hidden md:table-cell px-3 py-3 whitespace-nowrap text-xs text-right text-red-700 font-medium'>
                                                    {account.liabilityAmount > 0 ? formatCurrency(account.liabilityAmount) : '-'}
                                                </td>

                                                {/* Mobile */}
                                                <td
                                                    className='md:hidden px-4 py-4 cursor-pointer'
                                                    onClick={() => toggleRow(index)}
                                                >
                                                    <div className='flex items-center justify-between'>
                                                        <div className='flex-1 min-w-0'>
                                                            <div className='text-sm font-medium text-gray-900'>
                                                                {account.accountCode} - {account.accountName}
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

                                            {/* Fila expandida (solo mobile) */}
                                            {expandedRows.has(index) && (
                                                <tr key={`expanded-${index}`} className='md:hidden bg-gray-50'>
                                                    <td colSpan={5} className='px-4 py-4'>
                                                        <div className='space-y-2 text-sm'>
                                                            <div className='flex justify-between items-center'>
                                                                <span className='text-gray-600 font-medium'>Código:</span>
                                                                <span className='text-gray-900 font-semibold'>{account.accountCode}</span>
                                                            </div>
                                                            <div className='flex justify-between items-center'>
                                                                <span className='text-gray-600 font-medium'>Nombre:</span>
                                                                <span className='text-gray-900 text-right text-xs'>{account.accountName}</span>
                                                            </div>
                                                            <div className='border-t border-gray-200 my-2'></div>
                                                            <div className='flex justify-between items-center'>
                                                                <span className='text-blue-700 font-medium'>Activo:</span>
                                                                <span className='text-blue-700 font-semibold text-lg'>
                                                                    {account.assetAmount > 0 ? formatCurrency(account.assetAmount) : '-'}
                                                                </span>
                                                            </div>
                                                            <div className='flex justify-between items-center'>
                                                                <span className='text-red-700 font-medium'>Pasivo:</span>
                                                                <span className='text-red-700 font-semibold text-lg'>
                                                                    {account.liabilityAmount > 0 ? formatCurrency(account.liabilityAmount) : '-'}
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

                        {/* Totales al pie */}
                        <div className="mt-4 pt-4 border-t-2 border-gray-300 space-y-2">
                            <div className="flex justify-between items-center px-3">
                                <span className="text-sm font-bold text-blue-900">Total Activos:</span>
                                <span className="text-lg font-bold text-blue-700">{formatCurrency(totals?.total_assets || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center px-3">
                                <span className="text-sm font-bold text-red-900">Total Pasivos:</span>
                                <span className="text-lg font-bold text-red-700">{formatCurrency(totals?.total_liabilities || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center px-3">
                                <span className="text-sm font-bold text-green-900">Patrimonio:</span>
                                <span className="text-lg font-bold text-green-700">{formatCurrency(totals?.total_equity || 0)}</span>
                            </div>
                            <div className="border-t border-gray-300 my-2"></div>
                            <div className="flex justify-between items-center px-3 bg-gray-100 py-2 rounded">
                                <span className="text-sm font-bold text-gray-700">Pasivos + Patrimonio:</span>
                                <span className="text-lg font-bold text-gray-900">
                                    {formatCurrency((totals?.total_liabilities || 0) + (totals?.total_equity || 0))}
                                </span>
                            </div>
                            {Math.abs(totals?.balance_check || 0) > 0.01 ? (
                                <div className="flex justify-between items-center px-3 bg-red-50 py-2 rounded">
                                    <span className="text-xs text-red-600 font-bold">Diferencia (debe ser 0):</span>
                                    <span className="text-sm text-red-600 font-bold">{formatCurrency(totals?.balance_check || 0)}</span>
                                </div>
                            ) : (
                                <div className="text-center py-2 bg-green-50 rounded">
                                    <span className="text-xs text-green-600 font-bold">✓ Balance cuadrado</span>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        )
}

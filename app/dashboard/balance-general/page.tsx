'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { Calendar } from 'lucide-react'

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface Account {
    accountCode: string
    accountName: string
    amount: number
    verticalAnalysis: number
}

interface MonthData {
    currentAssets: Account[]
    nonCurrentAssets: Account[]
    currentLiabilities: Account[]
    nonCurrentLiabilities: Account[]
    equity: Account[]
    totals: {
        totalCurrentAssets: number
        totalNonCurrentAssets: number
        totalAssets: number
        totalCurrentLiabilities: number
        totalNonCurrentLiabilities: number
        totalLiabilities: number
        totalEquity: number
        totalLiabilitiesAndEquity: number
        balanceCheck: number
    }
}

export default function BalanceGeneralPage() {
    const [yearData, setYearData] = useState<{ year: string, months: { [key: string]: MonthData } } | null>(null)
    const [selectedYear, setSelectedYear] = useState<string>('')
    const [availableYears, setAvailableYears] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchAvailableYears() {
            try {
                const res = await fetch('/api/data/balance-general')
                if (!res.ok) throw new Error('Error al cargar años disponibles')
                const result = await res.json()
                
                if (result.availableYears && result.availableYears.length > 0) {
                    setAvailableYears(result.availableYears)
                    setSelectedYear(result.availableYears[0])
                }
            } catch (err) {
                console.error('Error fetching available years:', err)
                setError(err instanceof Error ? err.message : 'Error desconocido')
            }
        }
        fetchAvailableYears()
    }, [])

    useEffect(() => {
        if (!selectedYear) return

        async function fetchYearData() {
            try {
                setLoading(true)
                const res = await fetch(`/api/data/balance-general?year=${selectedYear}`)
                if (!res.ok) throw new Error('Error al cargar datos del año')
                const result = await res.json()

                if (result.success && result.data) {
                    setYearData(result.data)
                    setError(null)
                } else {
                    setError(result.error || 'No hay datos para este año')
                    setYearData(null)
                }
            } catch (err) {
                console.error('Error fetching year data:', err)
                setError(err instanceof Error ? err.message : 'Error desconocido')
                setYearData(null)
            } finally {
                setLoading(false)
            }
        }
        fetchYearData()
    }, [selectedYear])

    if (loading && !yearData) {
        return (
            <div>
                <Header title='Balance General Comparativo' subtitle='Cargando datos...' />
                <div className='p-8 flex items-center justify-center'>
                    <div className='text-gray-600 animate-pulse'>Cargando datos...</div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div>
                <Header title='Balance General Comparativo' subtitle='Error' />
                <div className='p-8'>
                    <Card>
                        <div className='text-red-600'>Error: {error}</div>
                    </Card>
                </div>
            </div>
        )
    }

    if (!yearData || !yearData.months) {
        return (
            <div>
                <Header title='Balance General Comparativo' subtitle='No hay datos disponibles' />
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

    // Obtener lista de meses disponibles en el año
    const availableMonths = Object.keys(yearData.months).sort()
    
    // Crear estructura de cuentas unificadas
    const accountsStructure = new Map<string, { code: string, name: string, monthlyAmounts: { [key: string]: number }, verticalAnalysis: number }>()

    // Recopilar todas las cuentas únicas
    availableMonths.forEach(month => {
        const monthData = yearData.months[month]
        
        const processAccounts = (accounts: Account[]) => {
            accounts.forEach(account => {
                if (!accountsStructure.has(account.accountCode)) {
                    accountsStructure.set(account.accountCode, {
                        code: account.accountCode,
                        name: account.accountName,
                        monthlyAmounts: {},
                        verticalAnalysis: account.verticalAnalysis
                    })
                }
                accountsStructure.get(account.accountCode)!.monthlyAmounts[month] = account.amount
            })
        }

        processAccounts(monthData.currentAssets)
        processAccounts(monthData.nonCurrentAssets)
        processAccounts(monthData.currentLiabilities)
        processAccounts(monthData.nonCurrentLiabilities)
        processAccounts(monthData.equity)
    })

    // Obtener el último mes disponible para los datos de referencia
    const lastMonth = availableMonths[availableMonths.length - 1]
    const lastMonthData = yearData.months[lastMonth]

    const renderAccountRows = (accounts: Account[], bgColor: string = 'bg-white') => {
        return accounts.map((account, idx) => {
            const accountData = accountsStructure.get(account.accountCode)
            if (!accountData) return null

            return (
                <tr key={`${account.accountCode}-${idx}`} className={`${bgColor} hover:bg-gray-50`}>
                    <td className='px-3 py-2 text-xs text-gray-900 whitespace-nowrap'>{account.accountName}</td>
                    {availableMonths.map(month => (
                        <td key={month} className='px-3 py-2 text-xs text-right text-gray-900'>
                            {accountData.monthlyAmounts[month] ? formatCurrency(accountData.monthlyAmounts[month]) : '-'}
                        </td>
                    ))}
                    <td className='px-3 py-2 text-xs text-right font-medium text-gray-700'>
                        {accountData.verticalAnalysis.toFixed(1)}%
                    </td>
                </tr>
            )
        })
    }

    const renderSubtotalRow = (label: string, amounts: { [key: string]: number }, bgColor: string, textColor: string) => {
        return (
            <tr className={`${bgColor} font-bold`}>
                <td className={`px-3 py-2 text-xs ${textColor}`}>{label}</td>
                {availableMonths.map(month => {
                    const amount = amounts[month] || 0
                    return (
                        <td key={month} className={`px-3 py-2 text-xs text-right ${textColor}`}>
                            {formatCurrency(amount)}
                        </td>
                    )
                })}
                <td className={`px-3 py-2 text-xs text-right ${textColor}`}>-</td>
            </tr>
        )
    }

    const renderTotalRow = (label: string, amounts: { [key: string]: number }, bgColor: string, textColor: string) => {
        return (
            <tr className={`${bgColor} font-bold text-sm`}>
                <td className={`px-3 py-3 ${textColor} uppercase`}>{label}</td>
                {availableMonths.map(month => {
                    const amount = amounts[month] || 0
                    return (
                        <td key={month} className={`px-3 py-3 text-right ${textColor}`}>
                            {formatCurrency(amount)}
                        </td>
                    )
                })}
                <td className={`px-3 py-3 text-right ${textColor}`}>100.0%</td>
            </tr>
        )
    }

    // Calcular totales por mes
    const totalCurrentAssetsByMonth: { [key: string]: number } = {}
    const totalNonCurrentAssetsByMonth: { [key: string]: number } = {}
    const totalAssetsByMonth: { [key: string]: number } = {}
    const totalCurrentLiabilitiesByMonth: { [key: string]: number } = {}
    const totalNonCurrentLiabilitiesByMonth: { [key: string]: number } = {}
    const totalLiabilitiesByMonth: { [key: string]: number } = {}
    const totalEquityByMonth: { [key: string]: number } = {}
    const totalLiabilitiesAndEquityByMonth: { [key: string]: number } = {}

    availableMonths.forEach(month => {
        const data = yearData.months[month]
        totalCurrentAssetsByMonth[month] = data.totals.totalCurrentAssets
        totalNonCurrentAssetsByMonth[month] = data.totals.totalNonCurrentAssets
        totalAssetsByMonth[month] = data.totals.totalAssets
        totalCurrentLiabilitiesByMonth[month] = data.totals.totalCurrentLiabilities
        totalNonCurrentLiabilitiesByMonth[month] = data.totals.totalNonCurrentLiabilities
        totalLiabilitiesByMonth[month] = data.totals.totalLiabilities
        totalEquityByMonth[month] = data.totals.totalEquity
        totalLiabilitiesAndEquityByMonth[month] = data.totals.totalLiabilitiesAndEquity
    })

    return (
        <div>
            <Header
                title='Balance General Comparativo'
                subtitle={`Para Análisis Vertical y Horizontal - Año ${selectedYear}`}
            />

            <div className='p-8 space-y-6'>
                {/* Selector de Año */}
                <div className='flex justify-end'>
                    <div className='bg-white rounded-lg shadow-sm border border-gray-200 inline-flex'>
                        <div className='p-4'>
                            <div className='flex items-center gap-3'>
                                <Calendar className='h-5 w-5 text-blue-600' />
                                <span className='text-sm font-medium text-gray-700'>Año:</span>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className='border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                >
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabla Comparativa */}
                <Card>
                    <div className='overflow-x-auto'>
                        <table className='min-w-full divide-y divide-gray-200'>
                            <thead className='bg-gray-100 sticky top-0'>
                                <tr>
                                    <th className='px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase'>
                                        Cuenta
                                    </th>
                                    {availableMonths.map(month => (
                                        <th key={month} className='px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase'>
                                            {MONTH_NAMES[parseInt(month) - 1]}
                                        </th>
                                    ))}
                                    <th className='px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase'>
                                        Análisis<br/>Vertical %
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='bg-white divide-y divide-gray-200'>
                                {/* SECCIÓN ACTIVO */}
                                <tr className='bg-green-700'>
                                    <td colSpan={availableMonths.length + 2} className='px-3 py-2 text-sm font-bold text-white uppercase'>
                                        ACTIVO
                                    </td>
                                </tr>

                                {/* Activo Corriente */}
                                <tr className='bg-green-100'>
                                    <td colSpan={availableMonths.length + 2} className='px-3 py-2 text-xs font-bold text-green-800 uppercase'>
                                        ACTIVO CORRIENTE
                                    </td>
                                </tr>
                                {renderAccountRows(lastMonthData.currentAssets)}
                                {renderSubtotalRow('Total Activo Corriente', totalCurrentAssetsByMonth, 'bg-green-50', 'text-green-800')}

                                {/* Activo No Corriente */}
                                <tr className='bg-green-100'>
                                    <td colSpan={availableMonths.length + 2} className='px-3 py-2 text-xs font-bold text-green-800 uppercase'>
                                        ACTIVO NO CORRIENTE
                                    </td>
                                </tr>
                                {renderAccountRows(lastMonthData.nonCurrentAssets)}
                                {renderSubtotalRow('Total Activo No Corriente', totalNonCurrentAssetsByMonth, 'bg-green-50', 'text-green-800')}

                                {/* Total Activo */}
                                {renderTotalRow('TOTAL ACTIVO', totalAssetsByMonth, 'bg-green-700', 'text-white')}

                                {/* SECCIÓN PASIVO */}
                                <tr className='bg-orange-600'>
                                    <td colSpan={availableMonths.length + 2} className='px-3 py-2 text-sm font-bold text-white uppercase'>
                                        PASIVO
                                    </td>
                                </tr>

                                {/* Pasivo Corriente */}
                                <tr className='bg-orange-100'>
                                    <td colSpan={availableMonths.length + 2} className='px-3 py-2 text-xs font-bold text-orange-800 uppercase'>
                                        PASIVO CORRIENTE
                                    </td>
                                </tr>
                                {renderAccountRows(lastMonthData.currentLiabilities)}
                                {renderSubtotalRow('Total Pasivo Corriente', totalCurrentLiabilitiesByMonth, 'bg-orange-50', 'text-orange-800')}

                                {/* Pasivo No Corriente */}
                                <tr className='bg-orange-100'>
                                    <td colSpan={availableMonths.length + 2} className='px-3 py-2 text-xs font-bold text-orange-800 uppercase'>
                                        PASIVO NO CORRIENTE
                                    </td>
                                </tr>
                                {renderAccountRows(lastMonthData.nonCurrentLiabilities)}
                                {renderSubtotalRow('Total Pasivo No Corriente', totalNonCurrentLiabilitiesByMonth, 'bg-orange-50', 'text-orange-800')}

                                {/* Total Pasivo */}
                                {renderTotalRow('TOTAL PASIVO', totalLiabilitiesByMonth, 'bg-orange-600', 'text-white')}

                                {/* SECCIÓN PATRIMONIO */}
                                <tr className='bg-blue-700'>
                                    <td colSpan={availableMonths.length + 2} className='px-3 py-2 text-sm font-bold text-white uppercase'>
                                        PATRIMONIO
                                    </td>
                                </tr>
                                {renderAccountRows(lastMonthData.equity)}
                                {renderTotalRow('TOTAL PATRIMONIO', totalEquityByMonth, 'bg-blue-600', 'text-white')}

                                {/* Total Pasivo + Patrimonio */}
                                {renderTotalRow('TOTAL PASIVO + PATRIMONIO', totalLiabilitiesAndEquityByMonth, 'bg-blue-800', 'text-white')}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    )
}

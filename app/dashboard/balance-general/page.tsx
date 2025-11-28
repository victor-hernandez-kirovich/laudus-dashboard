'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { Calendar } from 'lucide-react'

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

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
    const [activeTab, setActiveTab] = useState<'general' | 'vertical' | 'horizontal'>('general')

    // Estado para drag scroll
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [startY, setStartY] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)
    const [scrollTop, setScrollTop] = useState(0)

    // Handlers para drag scroll
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const element = e.currentTarget
        setIsDragging(true)
        setStartX(e.pageX - element.offsetLeft)
        setStartY(e.pageY - element.offsetTop)
        setScrollLeft(element.scrollLeft)
        setScrollTop(element.scrollTop)
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return
        e.preventDefault()
        const element = e.currentTarget
        const x = e.pageX - element.offsetLeft
        const y = e.pageY - element.offsetTop
        const walkX = (x - startX) * 1.5
        const walkY = (y - startY) * 1.5
        element.scrollLeft = scrollLeft - walkX
        element.scrollTop = scrollTop - walkY
    }

    const handleMouseUpOrLeave = () => {
        setIsDragging(false)
    }

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

    const renderAccountRows = (accounts: Account[], bgColor: string = 'bg-white', stickyBgColor: string = 'bg-white') => {
        return accounts.map((account, idx) => {
            const accountData = accountsStructure.get(account.accountCode)
            if (!accountData) return null

            return (
                <tr key={`${account.accountCode}-${idx}`} className={`group ${bgColor} hover:bg-white`}>
                    <td className={`px-3 py-2 text-xs text-black whitespace-nowrap sticky left-0 ${stickyBgColor} group-hover:bg-white z-[5]`}>{account.accountName}</td>
                    {availableMonths.map(month => (
                        <td key={month} className='px-3 py-2 text-xs text-right text-black'>
                            {accountData.monthlyAmounts[month] ? formatCurrency(accountData.monthlyAmounts[month]) : '-'}
                        </td>
                    ))}
                </tr>
            )
        })
    }

    const renderSubtotalRow = (label: string, amounts: { [key: string]: number }, bgColor: string, textColor: string) => {
        return (
            <tr className={`group ${bgColor} font-bold hover:bg-white`}>
                <td className={`px-3 py-2 text-xs ${textColor} sticky left-0 ${bgColor} group-hover:bg-white z-[5]`}>{label}</td>
                {availableMonths.map(month => {
                    const amount = amounts[month] || 0
                    return (
                        <td key={month} className={`px-3 py-2 text-xs text-right ${textColor}`}>
                            {formatCurrency(amount)}
                        </td>
                    )
                })}
            </tr>
        )
    }

    const renderTotalRow = (label: string, amounts: { [key: string]: number }, bgColor: string, textColor: string) => {
        return (
            <tr className={`group ${bgColor} font-bold text-sm hover:bg-white`}>
                <td className={`px-3 py-3 ${textColor} uppercase sticky left-0 ${bgColor} group-hover:bg-white z-[5]`}>{label}</td>
                {availableMonths.map(month => {
                    const amount = amounts[month] || 0
                    return (
                        <td key={month} className={`px-3 py-3 text-right ${textColor}`}>
                            {formatCurrency(amount)}
                        </td>
                    )
                })}
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
                {/* Controles Superiores */}
                <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                    {/* Selector de Pestañas */}
                    <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'general'
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                }`}
                        >
                            📊 Balance General
                        </button>
                        <button
                            onClick={() => setActiveTab('vertical')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'vertical'
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                }`}
                        >
                            📈 Análisis Vertical
                        </button>
                        <button
                            onClick={() => setActiveTab('horizontal')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'horizontal'
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                }`}
                        >
                            📉 Análisis Horizontal
                        </button>
                    </div>

                    {/* Selector de Año */}
                    <div className='bg-white rounded-lg shadow-sm border border-gray-200 inline-flex'>
                        <div className='p-4'>
                            <div className='flex items-center gap-3'>
                                <Calendar className='h-5 w-5 text-blue-600' />
                                <span className='text-sm font-medium text-gray-700'>Año:</span>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className='border border-gray-300 text-gray-700 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                >
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenido según pestaña activa */}
                {activeTab === 'general' && (
                    <Card>
                        <div
                            className={`overflow-x-auto max-h-[calc(100vh-250px)] ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUpOrLeave}
                            onMouseLeave={handleMouseUpOrLeave}
                        >
                            <table className='min-w-full divide-y divide-gray-200'>
                                <thead className='bg-gray-100 sticky top-0 z-30'>
                                    <tr>
                                        <th className='px-3 py-3 text-left text-sm font-bold text-gray-700 uppercase sticky left-0 bg-gray-100 z-40'>
                                            Cuenta
                                        </th>
                                        {availableMonths.map(month => (
                                            <th key={month} className='px-3 py-3 text-center text-sm font-bold text-gray-700 uppercase'>
                                                {MONTH_NAMES[parseInt(month) - 1]}
                                            </th>
                                        ))}
                                    </tr>
                                    {/* Línea divisoria */}
                                    <tr>
                                        <td colSpan={availableMonths.length + 1} className='border-t-3 border-black'></td>
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                    {/* SECCIÓN ACTIVO */}
                                    <tr className='bg-green-400'>
                                        <td colSpan={availableMonths.length + 1} className='px-3 py-2 text-sm font-bold text-gray-900 uppercase'>
                                            ACTIVO
                                        </td>
                                    </tr>

                                    {/* Activo Corriente */}
                                    <tr className='bg-green-300'>
                                        <td colSpan={availableMonths.length + 1} className='px-3 py-2 text-xs font-bold text-gray-900 uppercase'>
                                            ACTIVO CORRIENTE
                                        </td>
                                    </tr>
                                    {renderAccountRows(lastMonthData.currentAssets, 'bg-green-50', 'bg-green-50')}
                                    {renderSubtotalRow('Total Activo Corriente', totalCurrentAssetsByMonth, 'bg-green-200', 'text-gray-900')}
                                    {/* Línea divisoria */}
                                    <tr>
                                        <td colSpan={availableMonths.length + 1} className='border-t-2 border-black'></td>
                                    </tr>
                                    {/* Activo No Corriente */}
                                    <tr className='bg-green-300'>
                                        <td colSpan={availableMonths.length + 1} className='px-3 py-2 text-xs font-bold text-gray-900 uppercase'>
                                            ACTIVO NO CORRIENTE
                                        </td>
                                    </tr>
                                    {renderAccountRows(lastMonthData.nonCurrentAssets, 'bg-green-50', 'bg-green-50')}
                                    {renderSubtotalRow('Total Activo No Corriente', totalNonCurrentAssetsByMonth, 'bg-green-200', 'text-gray-900')}

                                    {/* Total Activo */}
                                    {renderTotalRow('TOTAL ACTIVO', totalAssetsByMonth, 'bg-green-400', 'text-black')}

                                    {/* Línea divisoria */}
                                    <tr>
                                        <td colSpan={availableMonths.length + 1} className='border-t-3 border-black'></td>
                                    </tr>

                                    {/* SECCIÓN PASIVO */}
                                    <tr className='bg-orange-400'>
                                        <td colSpan={availableMonths.length + 1} className='px-3 py-2 text-sm font-bold text-gray-900 uppercase'>
                                            PASIVO
                                        </td>
                                    </tr>

                                    {/* Pasivo Corriente */}
                                    <tr className='bg-orange-200'>
                                        <td colSpan={availableMonths.length + 1} className='px-3 py-2 text-xs font-bold text-gray-900 uppercase'>
                                            PASIVO CORRIENTE
                                        </td>
                                    </tr>
                                    {renderAccountRows(lastMonthData.currentLiabilities, 'bg-orange-50', 'bg-orange-50')}
                                    {renderSubtotalRow('Total Pasivo Corriente', totalCurrentLiabilitiesByMonth, 'bg-orange-100', 'text-gray-900')}
                                    {/* Línea divisoria */}
                                    <tr>
                                        <td colSpan={availableMonths.length + 1} className='border-t-2 border-black'></td>
                                    </tr>
                                    {/* Pasivo No Corriente */}
                                    <tr className='bg-orange-200'>
                                        <td colSpan={availableMonths.length + 1} className='px-3 py-2 text-xs font-bold text-gray-900 uppercase'>
                                            PASIVO NO CORRIENTE
                                        </td>
                                    </tr>
                                    {renderAccountRows(lastMonthData.nonCurrentLiabilities, 'bg-orange-50', 'bg-orange-50')}
                                    {renderSubtotalRow('Total Pasivo No Corriente', totalNonCurrentLiabilitiesByMonth, 'bg-orange-100', 'text-gray-900')}

                                    {/* Total Pasivo */}
                                    {renderTotalRow('TOTAL PASIVO', totalLiabilitiesByMonth, 'bg-orange-400', 'text-black')}

                                    {/* Línea divisoria */}
                                    <tr>
                                        <td colSpan={availableMonths.length + 1} className='border-t-3 border-black'></td>
                                    </tr>

                                    {/* SECCIÓN PATRIMONIO */}
                                    <tr className='bg-blue-400'>
                                        <td colSpan={availableMonths.length + 1} className='px-3 py-2 text-sm font-bold text-gray-900 uppercase'>
                                            PATRIMONIO
                                        </td>
                                    </tr>
                                    {renderAccountRows(lastMonthData.equity, 'bg-blue-300', 'bg-blue-300')}
                                    {renderTotalRow('TOTAL PATRIMONIO', totalEquityByMonth, 'bg-blue-100', 'text-gray-900')}

                                    {/* Total Pasivo + Patrimonio */}
                                    {renderTotalRow('TOTAL PASIVO + PATRIMONIO', totalLiabilitiesAndEquityByMonth, 'bg-blue-400', 'text-black')}
                                    {/* Línea divisoria */}
                                    <tr>
                                        <td colSpan={availableMonths.length * 2 + 1} className='border-t-3 border-gray-900'></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Análisis Vertical */}
                {activeTab === 'vertical' && (
                    <Card>

                        <div
                            className={`overflow-x-auto max-h-[calc(100vh-250px)] ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUpOrLeave}
                            onMouseLeave={handleMouseUpOrLeave}
                        >
                            <table className='min-w-full divide-y divide-gray-200'>
                                <thead className='bg-gray-100 sticky top-0 z-30'>
                                    <tr>
                                        <th className='px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase sticky left-0 bg-gray-100 z-40'>Cuenta</th>
                                        {availableMonths.map(month => (
                                            <th key={month} colSpan={2} className='px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase border-l border-gray-300'>
                                                {MONTH_NAMES[parseInt(month) - 1]}
                                            </th>
                                        ))}
                                    </tr>
                                    <tr className='bg-gray-50 sticky top-[49px] z-20'>
                                        <th className='px-3 py-2 text-xs font-medium text-gray-600 sticky left-0 bg-gray-50 z-40'></th>
                                        {availableMonths.map(month => (
                                            <React.Fragment key={`sub-${month}`}>
                                                <th className='px-3 py-2 text-right text-xs font-medium text-gray-600 border-l border-gray-300'>Valor</th>
                                                <th className='px-3 py-2 text-right text-xs font-medium text-gray-600'>%</th>
                                            </React.Fragment>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                    {/* Línea divisoria */}
                                    <tr>
                                        <td colSpan={availableMonths.length * 2 + 1} className='border-t-12 border-gray-900'></td>
                                    </tr>
                                    {/* ACTIVOS */}
                                    <tr className='bg-green-400'>
                                        <td colSpan={availableMonths.length * 2 + 1} className='px-3 py-2 text-sm font-bold text-gray-900 uppercase'>ACTIVO</td>
                                    </tr>
                                    <tr className='bg-green-300'>
                                        <td colSpan={availableMonths.length * 2 + 1} className='px-3 py-2 text-xs font-bold text-gray-900 uppercase'>ACTIVO CORRIENTE</td>
                                    </tr>
                                    {lastMonthData.currentAssets.map((account, idx) => {
                                        const accountData = accountsStructure.get(account.accountCode)
                                        return (
                                            <tr key={`va-ca-${idx}`} className='group bg-green-50 hover:bg-white'>
                                                <td className='px-3 py-2 text-xs text-black sticky left-0 bg-green-50 group-hover:bg-white z-[5]'>{account.accountName}</td>
                                                {availableMonths.map(month => {
                                                    const value = accountData?.monthlyAmounts[month] || 0
                                                    const total = totalAssetsByMonth[month] || 1
                                                    const percentage = (value / total) * 100
                                                    return (
                                                        <React.Fragment key={`va-ca-${idx}-${month}`}>
                                                            <td className='px-3 py-2 text-xs text-right text-gray-900 border-l border-gray-200'>{formatCurrency(value)}</td>
                                                            <td className='px-3 py-2 text-xs text-right text-blue-700 font-medium'>{percentage.toFixed(1)}%</td>
                                                        </React.Fragment>
                                                    )
                                                })}
                                            </tr>
                                        )
                                    })}
                                    <tr className='group bg-green-200 font-bold hover:bg-white'>
                                        <td className='px-3 py-2 text-xs text-gray-900 sticky left-0 bg-green-200 group-hover:bg-white z-[5]'>Total Activo Corriente</td>
                                        {availableMonths.map(month => {
                                            const value = totalCurrentAssetsByMonth[month]
                                            const total = totalAssetsByMonth[month] || 1
                                            const percentage = (value / total) * 100
                                            return (
                                                <React.Fragment key={`va-tca-${month}`}>
                                                    <td className='px-3 py-2 text-xs text-right text-gray-900 border-l border-gray-200'>{formatCurrency(value)}</td>
                                                    <td className='px-3 py-2 text-xs text-right text-gray-900'>{percentage.toFixed(1)}%</td>
                                                </React.Fragment>
                                            )
                                        })}
                                    </tr>
                                    {/* Línea divisoria */}
                                    <tr>
                                        <td colSpan={availableMonths.length * 2 + 1} className='border-t-2 border-gray-500'></td>
                                    </tr>

                                    <tr className='bg-green-300'>
                                        <td colSpan={availableMonths.length * 2 + 1} className='px-3 py-2 text-xs font-bold text-gray-900 uppercase'>ACTIVO NO CORRIENTE</td>
                                    </tr>
                                    {lastMonthData.nonCurrentAssets.map((account, idx) => {
                                        const accountData = accountsStructure.get(account.accountCode)
                                        return (
                                            <tr key={`va-nca-${idx}`} className='group bg-green-50 hover:bg-white'>
                                                <td className='px-3 py-2 text-xs text-black sticky left-0 bg-green-50 group-hover:bg-white z-[5]'>{account.accountName}</td>
                                                {availableMonths.map(month => {
                                                    const value = accountData?.monthlyAmounts[month] || 0
                                                    const total = totalAssetsByMonth[month] || 1
                                                    const percentage = (value / total) * 100
                                                    return (
                                                        <React.Fragment key={`va-nca-${idx}-${month}`}>
                                                            <td className='px-3 py-2 text-xs text-right text-gray-900 border-l border-gray-200'>{formatCurrency(value)}</td>
                                                            <td className='px-3 py-2 text-xs text-right text-blue-700 font-medium'>{percentage.toFixed(1)}%</td>
                                                        </React.Fragment>
                                                    )
                                                })}
                                            </tr>
                                        )
                                    })}
                                    <tr className='group bg-green-200 font-bold hover:bg-white'>
                                        <td className='px-3 py-2 text-xs text-gray-900 sticky left-0 bg-green-200 group-hover:bg-white z-[5]'>Total Activo No Corriente</td>
                                        {availableMonths.map(month => {
                                            const value = totalNonCurrentAssetsByMonth[month]
                                            const total = totalAssetsByMonth[month] || 1
                                            const percentage = (value / total) * 100
                                            return (
                                                <React.Fragment key={`va-tnca-${month}`}>
                                                    <td className='px-3 py-2 text-xs text-right text-gray-900 border-l border-gray-200'>{formatCurrency(value)}</td>
                                                    <td className='px-3 py-2 text-xs text-right text-gray-900'>{percentage.toFixed(1)}%</td>
                                                </React.Fragment>
                                            )
                                        })}
                                    </tr>
                                    <tr className='group bg-green-400 font-bold text-sm hover:bg-green-200'>
                                        <td className='px-3 py-3 text-black uppercase sticky left-0 bg-green-400 group-hover:bg-green-200 z-[5]'>TOTAL ACTIVO</td>
                                        {availableMonths.map(month => (
                                            <React.Fragment key={`va-ta-${month}`}>
                                                <td className='px-3 py-3 text-right text-black border-l border-green-300'>{formatCurrency(totalAssetsByMonth[month])}</td>
                                                <td className='px-3 py-3 text-right text-black'>100.0%</td>
                                            </React.Fragment>
                                        ))}
                                    </tr>

                                    {/* Línea divisoria */}
                                    <tr>
                                        <td colSpan={availableMonths.length * 2 + 1} className='border-t-4 border-gray-900'></td>
                                    </tr>

                                    {/* PASIVOS */}
                                    <tr className='bg-orange-400'>
                                        <td colSpan={availableMonths.length * 2 + 1} className='px-3 py-2 text-sm font-bold text-gray-900 uppercase'>PASIVO</td>
                                    </tr>
                                    <tr className='bg-orange-200'>
                                        <td colSpan={availableMonths.length * 2 + 1} className='px-3 py-2 text-xs font-bold text-gray-900 uppercase'>PASIVO CORRIENTE</td>
                                    </tr>
                                    {lastMonthData.currentLiabilities.map((account, idx) => {
                                        const accountData = accountsStructure.get(account.accountCode)
                                        return (
                                            <tr key={`va-cl-${idx}`} className='group bg-orange-50 hover:bg-white'>
                                                <td className='px-3 py-2 text-xs text-black sticky left-0 bg-orange-50 group-hover:bg-white z-[5]'>{account.accountName}</td>
                                                {availableMonths.map(month => {
                                                    const value = accountData?.monthlyAmounts[month] || 0
                                                    const total = totalLiabilitiesByMonth[month] || 1
                                                    const percentage = (value / total) * 100
                                                    return (
                                                        <React.Fragment key={`va-ncl-${idx}-${month}`}>
                                                            <td className='px-3 py-2 text-xs text-right font-medium text-gray-900 border-l border-gray-200'>{formatCurrency(value)}</td>
                                                            <td className='px-3 py-2 text-xs text-right font-medium text-blue-700'>{percentage.toFixed(1)}%</td>
                                                        </React.Fragment>
                                                    )
                                                })}
                                            </tr>
                                        )
                                    })}
                                    <tr className='group bg-orange-100 font-bold hover:bg-white'>
                                        <td className='px-3 py-2 text-xs text-gray-900 sticky left-0 bg-orange-100 group-hover:bg-white z-[5]'>Total Pasivo Corriente</td>
                                        {availableMonths.map(month => {
                                            const value = totalCurrentLiabilitiesByMonth[month]
                                            const total = totalLiabilitiesByMonth[month] || 1
                                            const percentage = (value / total) * 100
                                            return (
                                                <React.Fragment key={`va-tcl-${month}`}>
                                                    <td className='px-3 py-2 text-xs text-right text-gray-900 border-l border-gray-200'>{formatCurrency(value)}</td>
                                                    <td className='px-3 py-2 text-xs text-right text-gray-900'>{percentage.toFixed(1)}%</td>
                                                </React.Fragment>
                                            )
                                        })}
                                    </tr>
                                    {/* Línea divisoria */}
                                    <tr>
                                        <td colSpan={availableMonths.length * 2 + 1} className='border-t-2 border-gray-500'></td>
                                    </tr>

                                    <tr className='bg-orange-200'>
                                        <td colSpan={availableMonths.length * 2 + 1} className='px-3 py-2 text-xs font-bold text-gray-900 uppercase'>PASIVO NO CORRIENTE</td>
                                    </tr>
                                    {lastMonthData.nonCurrentLiabilities.map((account, idx) => {
                                        const accountData = accountsStructure.get(account.accountCode)
                                        return (
                                            <tr key={`va-ncl-${idx}`} className='group bg-orange-50 hover:bg-white'>
                                                <td className='px-3 py-2 text-xs text-black sticky left-0 bg-orange-50 group-hover:bg-white z-[5]'>{account.accountName}</td>
                                                {availableMonths.map(month => {
                                                    const value = accountData?.monthlyAmounts[month] || 0
                                                    const total = totalLiabilitiesByMonth[month] || 1
                                                    const percentage = (value / total) * 100
                                                    return (
                                                        <React.Fragment key={`va-ncl-${idx}-${month}`}>
                                                            <td className='px-3 py-2 text-xs text-right font-medium text-gray-900 border-l border-gray-200'>{formatCurrency(value)}</td>
                                                            <td className='px-3 py-2 text-xs text-right font-medium text-blue-700'>{percentage.toFixed(1)}%</td>
                                                        </React.Fragment>
                                                    )
                                                })}
                                            </tr>
                                        )
                                    })}
                                    <tr className='group bg-orange-100 font-bold hover:bg-white'>
                                        <td className='px-3 py-2 text-xs text-gray-900 sticky left-0 bg-orange-100 group-hover:bg-white z-[5]'>Total Pasivo No Corriente</td>
                                        {availableMonths.map(month => {
                                            const value = totalNonCurrentLiabilitiesByMonth[month]
                                            const total = totalLiabilitiesByMonth[month] || 1
                                            const percentage = (value / total) * 100
                                            return (
                                                <React.Fragment key={`va-tncl-${month}`}>
                                                    <td className='px-3 py-2 text-xs text-right text-gray-800 border-l border-gray-200'>{formatCurrency(value)}</td>
                                                    <td className='px-3 py-2 text-xs text-right font-medium text-blue-700'>{percentage.toFixed(1)}%</td>
                                                </React.Fragment>
                                            )
                                        })}
                                    </tr>
                                    <tr>
                                        <td colSpan={availableMonths.length * 2 + 1} className='border-t-2 border-gray-500'></td>
                                    </tr>
                                    <tr className='group bg-orange-400 font-bold text-sm hover:bg-orange-200'>
                                        <td className='px-3 py-3 text-black uppercase sticky left-0 bg-orange-400 group-hover:bg-orange-200 z-[5]'>TOTAL PASIVO</td>
                                        {availableMonths.map(month => (
                                            <React.Fragment key={`va-tl-${month}`}>
                                                <td className='px-3 py-3 text-right text-black border-l border-orange-200'>{formatCurrency(totalLiabilitiesByMonth[month])}</td>
                                                <td className='px-3 py-3 text-right text-blue-800'>100.0%</td>
                                            </React.Fragment>
                                        ))}
                                    </tr>

                                    {/* Línea divisoria */}
                                    <tr>
                                        <td colSpan={availableMonths.length * 2 + 1} className='border-t-3 border-gray-900'></td>
                                    </tr>

                                    {/* PATRIMONIO */}
                                    <tr className='bg-blue-400'>
                                        <td colSpan={availableMonths.length * 2 + 1} className='px-3 py-2 text-sm font-bold text-gray-900 uppercase'>PATRIMONIO</td>
                                    </tr>
                                    {lastMonthData.equity.map((account, idx) => {
                                        const accountData = accountsStructure.get(account.accountCode)
                                        return (
                                            <tr key={`va-eq-${idx}`} className='group bg-blue-300 hover:bg-white'>
                                                <td className='px-3 py-2 text-xs text-black sticky left-0 bg-blue-300 group-hover:bg-white z-[5]'>{account.accountName}</td>
                                                {availableMonths.map(month => {
                                                    const value = accountData?.monthlyAmounts[month] || 0
                                                    const total = totalEquityByMonth[month] || 1
                                                    const percentage = (value / total) * 100
                                                    return (
                                                        <React.Fragment key={`va-eq-${idx}-${month}`}>
                                                            <td className='px-3 py-2 text-sm text-right text-gray-900 border-l border-gray-200'>{formatCurrency(value)}</td>
                                                            <td className='px-3 py-2 text-sm text-right text-gray-900 font-medium'>{percentage.toFixed(1)}%</td>
                                                        </React.Fragment>
                                                    )
                                                })}
                                            </tr>
                                        )
                                    })}
                                    <tr className='group bg-blue-100 font-bold text-sm hover:bg-white'>
                                        <td className='px-3 py-3 text-gray-900 uppercase sticky left-0 bg-blue-100 group-hover:bg-white z-[5]'>TOTAL PATRIMONIO</td>
                                        {availableMonths.map(month => (
                                            <React.Fragment key={`va-te-${month}`}>
                                                <td className='px-3 py-3 text-right text-gray-900 border-l border-blue-200'>{formatCurrency(totalEquityByMonth[month])}</td>
                                                <td className='px-3 py-3 text-right text-gray-900'>100.0%</td>
                                            </React.Fragment>
                                        ))}
                                    </tr>
                                    {/* Línea divisoria */}
                                    <tr>
                                        <td colSpan={availableMonths.length * 2 + 1} className='border-t-3 border-gray-900'></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Análisis Horizontal */}
                {activeTab === 'horizontal' && (
                    <Card>

                        <div
                            className={`overflow-x-auto max-h-[calc(100vh-250px)] ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUpOrLeave}
                            onMouseLeave={handleMouseUpOrLeave}
                        >
                            {availableMonths.length < 2 ? (
                                <div className='p-8 text-center'>
                                    <p className='text-gray-500'>Se requieren al menos 2 meses para realizar el análisis horizontal.</p>
                                </div>
                            ) : (
                                <table className='min-w-full divide-y divide-gray-200'>
                                    <thead className='bg-gray-100 sticky top-0 z-30'>
                                        <tr>
                                            <th className='px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase sticky left-0 bg-gray-100 z-40'>Cuenta</th>
                                            {availableMonths.slice(1).map((month, idx) => {
                                                const prevMonth = availableMonths[idx]
                                                return (
                                                    <th key={month} colSpan={4} className='px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase border-l border-gray-300'>
                                                        {MONTH_NAMES[parseInt(prevMonth) - 1]} → {MONTH_NAMES[parseInt(month) - 1]}
                                                    </th>
                                                )
                                            })}
                                        </tr>
                                        <tr className='bg-gray-50 sticky top-[49px] z-20'>
                                            <th className='px-3 py-2 text-xs font-medium text-gray-600 sticky left-0 bg-gray-50 z-40'></th>
                                            {availableMonths.slice(1).map((month) => (
                                                <React.Fragment key={`sub-${month}`}>
                                                    <th className='px-3 py-2 text-right text-xs font-medium text-gray-600 border-l border-gray-300'>Anterior</th>
                                                    <th className='px-3 py-2 text-right text-xs font-medium text-gray-600'>Actual</th>
                                                    <th className='px-3 py-2 text-right text-xs font-medium text-gray-600'>Var $</th>
                                                    <th className='px-3 py-2 text-right text-xs font-medium text-gray-600'>Var %</th>
                                                </React.Fragment>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className='bg-white divide-y divide-gray-200'>
                                        {/* Línea divisoria */}
                                        <tr>
                                            <td colSpan={availableMonths.length * 2 + 1} className='border-t-12 border-gray-900'></td>
                                        </tr>
                                        {/* ACTIVOS */}
                                        <tr className='bg-green-400'>
                                            <td colSpan={(availableMonths.length - 1) * 4 + 1} className='px-3 py-2 text-sm font-bold text-gray-900 uppercase'>ACTIVO</td>
                                        </tr>
                                        <tr className='bg-green-300'>
                                            <td colSpan={(availableMonths.length - 1) * 4 + 1} className='px-3 py-2 text-xs font-bold text-gray-900 uppercase'>ACTIVO CORRIENTE</td>
                                        </tr>
                                        {lastMonthData.currentAssets.map((account, idx) => {
                                            const accountData = accountsStructure.get(account.accountCode)
                                            return (
                                                <tr key={`ha-ca-${idx}`} className='group bg-green-50 hover:bg-white'>
                                                    <td className='px-3 py-2 text-xs text-black sticky left-0 bg-green-50 group-hover:bg-white z-[5]'>{account.accountName}</td>
                                                    {availableMonths.slice(1).map((month, mIdx) => {
                                                        const prevMonth = availableMonths[mIdx]
                                                        const currentValue = accountData?.monthlyAmounts[month] || 0
                                                        const previousValue = accountData?.monthlyAmounts[prevMonth] || 0
                                                        const varAbs = currentValue - previousValue
                                                        const varPct = previousValue !== 0 ? (varAbs / previousValue) * 100 : 0
                                                        const varColor = varAbs > 0 ? 'text-green-600' : varAbs < 0 ? 'text-red-600' : 'text-gray-600'
                                                        return (
                                                            <React.Fragment key={`ha-ca-${idx}-${month}`}>
                                                                <td className='px-3 py-2 text-xs text-right text-gray-700 border-l border-gray-200'>{formatCurrency(previousValue)}</td>
                                                                <td className='px-3 py-2 text-xs text-right text-gray-900 font-medium'>{formatCurrency(currentValue)}</td>
                                                                <td className={`px-3 py-2 text-xs text-right font-medium ${varColor}`}>{formatCurrency(varAbs)}</td>
                                                                <td className={`px-3 py-2 text-xs text-right font-bold ${varColor}`}>{varPct.toFixed(1)}%</td>
                                                            </React.Fragment>
                                                        )
                                                    })}
                                                </tr>
                                            )
                                        })}
                                        <tr className='group bg-green-200 font-bold hover:bg-white'>
                                            <td className='px-3 py-2 text-xs text-gray-900 sticky left-0 bg-green-200 group-hover:bg-white z-[5]'>Total Activo Corriente</td>
                                            {availableMonths.slice(1).map((month, mIdx) => {
                                                const prevMonth = availableMonths[mIdx]
                                                const currentValue = totalCurrentAssetsByMonth[month]
                                                const previousValue = totalCurrentAssetsByMonth[prevMonth]
                                                const varAbs = currentValue - previousValue
                                                const varPct = previousValue !== 0 ? (varAbs / previousValue) * 100 : 0
                                                const varColor = varAbs > 0 ? 'text-gray-700' : varAbs < 0 ? 'text-red-700' : 'text-gray-700'
                                                return (
                                                    <React.Fragment key={`ha-tca-${month}`}>
                                                        <td className='px-3 py-2 text-xs text-right text-gray-700 border-l border-gray-200'>{formatCurrency(previousValue)}</td>
                                                        <td className='px-3 py-2 text-xs text-right text-gray-700 font-bold'>{formatCurrency(currentValue)}</td>
                                                        <td className={`px-3 py-2 text-xs text-right text-gray-700 font-bold ${varColor}`}>{formatCurrency(varAbs)}</td>
                                                        <td className={`px-3 py-2 text-xs text-right text-gray-700 font-bold ${varColor}`}>{varPct.toFixed(1)}%</td>
                                                    </React.Fragment>
                                                )
                                            })}
                                        </tr>
                                        {/* Línea divisoria */}
                                        <tr>
                                            <td colSpan={availableMonths.length * 2 + 1} className='border-t-2 border-gray-900'></td>
                                        </tr>

                                        <tr className='bg-green-300'>
                                            <td colSpan={(availableMonths.length - 1) * 4 + 1} className='px-3 py-2 text-xs font-bold text-gray-900 uppercase'>ACTIVO NO CORRIENTE</td>
                                        </tr>
                                        {lastMonthData.nonCurrentAssets.map((account, idx) => {
                                            const accountData = accountsStructure.get(account.accountCode)
                                            return (
                                                <tr key={`ha-nca-${idx}`} className='group bg-green-50 hover:bg-white'>
                                                    <td className='px-3 py-2 text-xs text-black sticky left-0 bg-green-50 group-hover:bg-white z-[5]'>{account.accountName}</td>
                                                    {availableMonths.slice(1).map((month, mIdx) => {
                                                        const prevMonth = availableMonths[mIdx]
                                                        const currentValue = accountData?.monthlyAmounts[month] || 0
                                                        const previousValue = accountData?.monthlyAmounts[prevMonth] || 0
                                                        const varAbs = currentValue - previousValue
                                                        const varPct = previousValue !== 0 ? (varAbs / previousValue) * 100 : 0
                                                        const varColor = varAbs > 0 ? 'text-green-600' : varAbs < 0 ? 'text-red-600' : 'text-gray-600'
                                                        return (
                                                            <React.Fragment key={`ha-nca-${idx}-${month}`}>
                                                                <td className='px-3 py-2 text-xs text-right text-gray-700 border-l border-gray-200'>{formatCurrency(previousValue)}</td>
                                                                <td className='px-3 py-2 text-xs text-right text-gray-900 font-medium'>{formatCurrency(currentValue)}</td>
                                                                <td className={`px-3 py-2 text-xs text-right font-medium ${varColor}`}>{formatCurrency(varAbs)}</td>
                                                                <td className={`px-3 py-2 text-xs text-right font-bold ${varColor}`}>{varPct.toFixed(1)}%</td>
                                                            </React.Fragment>
                                                        )
                                                    })}
                                                </tr>
                                            )
                                        })}
                                        <tr className='group bg-green-200 font-bold hover:bg-white'>
                                            <td className='px-3 py-2 text-xs text-gray-900 sticky left-0 bg-green-200 group-hover:bg-white z-[5]'>Total Activo No Corriente</td>
                                            {availableMonths.slice(1).map((month, mIdx) => {
                                                const prevMonth = availableMonths[mIdx]
                                                const currentValue = totalNonCurrentAssetsByMonth[month]
                                                const previousValue = totalNonCurrentAssetsByMonth[prevMonth]
                                                const varAbs = currentValue - previousValue
                                                const varPct = previousValue !== 0 ? (varAbs / previousValue) * 100 : 0
                                                const varColor = varAbs > 0 ? 'text-gray-700' : varAbs < 0 ? 'text-red-700' : 'text-gray-700'
                                                return (
                                                    <React.Fragment key={`ha-tnca-${month}`}>
                                                        <td className='px-3 py-2 text-xs text-right text-gray-700 border-l border-gray-200'>{formatCurrency(previousValue)}</td>
                                                        <td className='px-3 py-2 text-xs text-right text-gray-700 font-bold'>{formatCurrency(currentValue)}</td>
                                                        <td className={`px-3 py-2 text-xs text-right font-bold ${varColor}`}>{formatCurrency(varAbs)}</td>
                                                        <td className={`px-3 py-2 text-xs text-right font-bold ${varColor}`}>{varPct.toFixed(1)}%</td>
                                                    </React.Fragment>
                                                )
                                            })}
                                        </tr>
                                        {/* Línea divisoria */}
                                        <tr>
                                            <td colSpan={availableMonths.length * 2 + 1} className='border-t-2 border-gray-500'></td>
                                        </tr>
                                        <tr className='group bg-green-400 font-bold text-sm hover:bg-green-200'>
                                            <td className='px-3 py-3 text-black uppercase sticky left-0 bg-green-400 group-hover:bg-green-200 z-[5]'>TOTAL ACTIVO</td>
                                            {availableMonths.slice(1).map((month, mIdx) => {
                                                const prevMonth = availableMonths[mIdx]
                                                const currentValue = totalAssetsByMonth[month]
                                                const previousValue = totalAssetsByMonth[prevMonth]
                                                const varAbs = currentValue - previousValue
                                                const varPct = previousValue !== 0 ? (varAbs / previousValue) * 100 : 0
                                                const varColor = varAbs > 0 ? 'text-gray-900' : varAbs < 0 ? 'text-red-600' : 'text-gray-900'
                                                return (
                                                    <React.Fragment key={`ha-ta-${month}`}>
                                                        <td className='px-3 py-3 text-right text-gray-900 border-l border-green-300'>{formatCurrency(previousValue)}</td>
                                                        <td className='px-3 py-3 text-right text-black font-bold'>{formatCurrency(currentValue)}</td>
                                                        <td className={`px-3 py-3 text-right font-bold ${varColor}`}>{formatCurrency(varAbs)}</td>
                                                        <td className={`px-3 py-3 text-right font-bold ${varColor}`}>{varPct.toFixed(1)}%</td>
                                                    </React.Fragment>
                                                )
                                            })}
                                        </tr>

                                        {/* Línea divisoria */}
                                        <tr>
                                            <td colSpan={(availableMonths.length - 1) * 4 + 1} className='border-t-4 border-black'></td>
                                        </tr>

                                        {/* PASIVOS */}
                                        <tr className='bg-orange-400'>
                                            <td colSpan={(availableMonths.length - 1) * 4 + 1} className='px-3 py-2 text-sm font-bold text-gray-900 uppercase'>PASIVO</td>
                                        </tr>
                                        <tr className='bg-orange-200'>
                                            <td colSpan={(availableMonths.length - 1) * 4 + 1} className='px-3 py-2 text-xs font-bold text-gray-900 uppercase'>PASIVO CORRIENTE</td>
                                        </tr>
                                        {lastMonthData.currentLiabilities.map((account, idx) => {
                                            const accountData = accountsStructure.get(account.accountCode)
                                            return (
                                                <tr key={`ha-cl-${idx}`} className='group bg-orange-50 hover:bg-white'>
                                                    <td className='px-3 py-2 text-xs text-black sticky left-0 bg-orange-50 group-hover:bg-white z-[5]'>{account.accountName}</td>
                                                    {availableMonths.slice(1).map((month, mIdx) => {
                                                        const prevMonth = availableMonths[mIdx]
                                                        const currentValue = accountData?.monthlyAmounts[month] || 0
                                                        const previousValue = accountData?.monthlyAmounts[prevMonth] || 0
                                                        const varAbs = currentValue - previousValue
                                                        const varPct = previousValue !== 0 ? (varAbs / previousValue) * 100 : 0
                                                        const varColor = varAbs > 0 ? 'text-red-600' : varAbs < 0 ? 'text-green-600' : 'text-gray-600'
                                                        return (
                                                            <React.Fragment key={`ha-cl-${idx}-${month}`}>
                                                                <td className='px-3 py-2 text-xs text-right text-gray-700 border-l border-gray-200'>{formatCurrency(previousValue)}</td>
                                                                <td className='px-3 py-2 text-xs text-right text-gray-900 font-medium'>{formatCurrency(currentValue)}</td>
                                                                <td className={`px-3 py-2 text-xs text-right font-medium ${varColor}`}>{formatCurrency(varAbs)}</td>
                                                                <td className={`px-3 py-2 text-xs text-right font-bold ${varColor}`}>{varPct.toFixed(1)}%</td>
                                                            </React.Fragment>
                                                        )
                                                    })}
                                                </tr>
                                            )
                                        })}
                                        <tr className='group bg-orange-100 font-bold hover:bg-white'>
                                            <td className='px-3 py-2 text-xs text-gray-900 sticky left-0 bg-orange-100 group-hover:bg-white z-[5]'>Total Pasivo Corriente</td>
                                            {availableMonths.slice(1).map((month, mIdx) => {
                                                const prevMonth = availableMonths[mIdx]
                                                const currentValue = totalCurrentLiabilitiesByMonth[month]
                                                const previousValue = totalCurrentLiabilitiesByMonth[prevMonth]
                                                const varAbs = currentValue - previousValue
                                                const varPct = previousValue !== 0 ? (varAbs / previousValue) * 100 : 0
                                                const varColor = varAbs > 0 ? 'text-gray-700' : varAbs < 0 ? 'text-green-700' : 'text-gray-700'
                                                return (
                                                    <React.Fragment key={`ha-tcl-${month}`}>
                                                        <td className='px-3 py-2 text-xs text-right text-gray-700 border-l border-gray-200'>{formatCurrency(previousValue)}</td>
                                                        <td className='px-3 py-2 text-xs text-right text-gray-700 font-medium'>{formatCurrency(currentValue)}</td>
                                                        <td className={`px-3 py-2 text-xs text-right font-medium ${varColor}`}>{formatCurrency(varAbs)}</td>
                                                        <td className={`px-3 py-2 text-xs text-right font-bold ${varColor}`}>{varPct.toFixed(1)}%</td>
                                                    </React.Fragment>
                                                )
                                            })}
                                        </tr>
                                         {/* Línea divisoria */}
                                        <tr>
                                            <td colSpan={availableMonths.length * 2 + 1} className='border-t-2 border-gray-500'></td>
                                        </tr>

                                        <tr className='bg-orange-200'>
                                            <td colSpan={(availableMonths.length - 1) * 4 + 1} className='px-3 py-2 text-xs font-bold text-gray-900 uppercase'>PASIVO NO CORRIENTE</td>
                                        </tr>
                                        {lastMonthData.nonCurrentLiabilities.map((account, idx) => {
                                            const accountData = accountsStructure.get(account.accountCode)
                                            return (
                                                <tr key={`ha-ncl-${idx}`} className='group bg-orange-50 hover:bg-white'>
                                                    <td className='px-3 py-2 text-xs text-black sticky left-0 bg-orange-50 group-hover:bg-white z-[5]'>{account.accountName}</td>
                                                    {availableMonths.slice(1).map((month, mIdx) => {
                                                        const prevMonth = availableMonths[mIdx]
                                                        const currentValue = accountData?.monthlyAmounts[month] || 0
                                                        const previousValue = accountData?.monthlyAmounts[prevMonth] || 0
                                                        const varAbs = currentValue - previousValue
                                                        const varPct = previousValue !== 0 ? (varAbs / previousValue) * 100 : 0
                                                        const varColor = varAbs > 0 ? 'text-red-600' : varAbs < 0 ? 'text-green-600' : 'text-gray-600'
                                                        return (
                                                            <React.Fragment key={`ha-ncl-${idx}-${month}`}>
                                                                <td className='px-3 py-2 text-xs text-right text-gray-700 border-l border-gray-200'>{formatCurrency(previousValue)}</td>
                                                                <td className='px-3 py-2 text-xs text-right text-gray-900 font-medium'>{formatCurrency(currentValue)}</td>
                                                                <td className={`px-3 py-2 text-xs text-right font-medium ${varColor}`}>{formatCurrency(varAbs)}</td>
                                                                <td className={`px-3 py-2 text-xs text-right font-bold ${varColor}`}>{varPct.toFixed(1)}%</td>
                                                            </React.Fragment>
                                                        )
                                                    })}
                                                </tr>
                                            )
                                        })}
                                        <tr className='group bg-orange-100 font-bold hover:bg-white'>
                                            <td className='px-3 py-2 text-xs text-gray-900 sticky left-0 bg-orange-100 group-hover:bg-white z-[5]'>Total Pasivo No Corriente</td>
                                            {availableMonths.slice(1).map((month, mIdx) => {
                                                const prevMonth = availableMonths[mIdx]
                                                const currentValue = totalNonCurrentLiabilitiesByMonth[month]
                                                const previousValue = totalNonCurrentLiabilitiesByMonth[prevMonth]
                                                const varAbs = currentValue - previousValue
                                                const varPct = previousValue !== 0 ? (varAbs / previousValue) * 100 : 0
                                                const varColor = varAbs > 0 ? 'text-gray-700' : varAbs < 0 ? 'text-green-700' : 'text-gray-700'
                                                return (
                                                    <React.Fragment key={`ha-tncl-${month}`}>
                                                        <td className='px-3 py-2 text-xs text-right text-gray-700 border-l border-gray-200'>{formatCurrency(previousValue)}</td>
                                                        <td className='px-3 py-2 text-xs text-right text-gray-800 font-medium'>{formatCurrency(currentValue)}</td>
                                                        <td className={`px-3 py-2 text-xs text-right font-medium ${varColor}`}>{formatCurrency(varAbs)}</td>
                                                        <td className={`px-3 py-2 text-xs text-right font-bold ${varColor}`}>{varPct.toFixed(1)}%</td>
                                                    </React.Fragment>
                                                )
                                            })}
                                        </tr>
                                         {/* Línea divisoria */}
                                        <tr>
                                            <td colSpan={availableMonths.length * 2 + 1} className='border-t-2 border-gray-500'></td>
                                        </tr>
                                        <tr className='group bg-orange-400 font-bold text-sm hover:bg-orange-200'>
                                            <td className='px-3 py-3 text-black uppercase sticky left-0 bg-orange-400 group-hover:bg-orange-200 z-[5]'>TOTAL PASIVO</td>
                                            {availableMonths.slice(1).map((month, mIdx) => {
                                                const prevMonth = availableMonths[mIdx]
                                                const currentValue = totalLiabilitiesByMonth[month]
                                                const previousValue = totalLiabilitiesByMonth[prevMonth]
                                                const varAbs = currentValue - previousValue
                                                const varPct = previousValue !== 0 ? (varAbs / previousValue) * 100 : 0
                                                const varColor = varAbs > 0 ? 'text-gray-900' : varAbs < 0 ? 'text-green-600' : 'text-gray-900'
                                                return (
                                                    <React.Fragment key={`ha-tl-${month}`}>
                                                        <td className='px-3 py-3 text-right text-gray-900 border-l border-orange-300'>{formatCurrency(previousValue)}</td>
                                                        <td className='px-3 py-3 text-right text-black font-bold'>{formatCurrency(currentValue)}</td>
                                                        <td className={`px-3 py-3 text-right font-bold ${varColor}`}>{formatCurrency(varAbs)}</td>
                                                        <td className={`px-3 py-3 text-right font-bold ${varColor}`}>{varPct.toFixed(1)}%</td>
                                                    </React.Fragment>
                                                )
                                            })}
                                        </tr>

                                        {/* Línea divisoria */}
                                        <tr>
                                            <td colSpan={(availableMonths.length - 1) * 4 + 1} className='border-t-4 border-black'></td>
                                        </tr>

                                        {/* PATRIMONIO */}
                                        <tr className='bg-blue-400'>
                                            <td colSpan={(availableMonths.length - 1) * 4 + 1} className='px-3 py-2 text-sm font-bold text-gray-900 uppercase'>PATRIMONIO</td>
                                        </tr>
                                        {lastMonthData.equity.map((account, idx) => {
                                            const accountData = accountsStructure.get(account.accountCode)
                                            return (
                                                <tr key={`ha-eq-${idx}`} className='group bg-blue-300 hover:bg-white'>
                                                    <td className='px-3 py-2 text-xs text-black sticky left-0 bg-blue-300 group-hover:bg-white z-[5]'>{account.accountName}</td>
                                                    {availableMonths.slice(1).map((month, mIdx) => {
                                                        const prevMonth = availableMonths[mIdx]
                                                        const currentValue = accountData?.monthlyAmounts[month] || 0
                                                        const previousValue = accountData?.monthlyAmounts[prevMonth] || 0
                                                        const varAbs = currentValue - previousValue
                                                        const varPct = previousValue !== 0 ? (varAbs / previousValue) * 100 : 0
                                                        const varColor = varAbs > 0 ? 'text-gray-900' : varAbs < 0 ? 'text-red-600' : 'text-gray-900'
                                                        return (
                                                            <React.Fragment key={`ha-eq-${idx}-${month}`}>
                                                                <td className='px-3 py-2 text-xs text-right text-gray-900 border-l border-gray-200'>{formatCurrency(previousValue)}</td>
                                                                <td className='px-3 py-2 text-xs text-right text-gray-900 font-bold'>{formatCurrency(currentValue)}</td>
                                                                <td className={`px-3 py-2 text-xs text-right font-bold ${varColor}`}>{formatCurrency(varAbs)}</td>
                                                                <td className={`px-3 py-2 text-xs text-right font-bold ${varColor}`}>{varPct.toFixed(1)}%</td>
                                                            </React.Fragment>
                                                        )
                                                    })}
                                                </tr>
                                            )
                                        })}
                                        <tr className='group bg-blue-200 font-bold text-sm hover:bg-white'>
                                            <td className='px-3 py-3 text-gray-900 uppercase sticky left-0 bg-blue-200 group-hover:bg-white z-[5]'>TOTAL PATRIMONIO</td>
                                            {availableMonths.slice(1).map((month, mIdx) => {
                                                const prevMonth = availableMonths[mIdx]
                                                const currentValue = totalEquityByMonth[month]
                                                const previousValue = totalEquityByMonth[prevMonth]
                                                const varAbs = currentValue - previousValue
                                                const varPct = previousValue !== 0 ? (varAbs / previousValue) * 100 : 0
                                                const varColor = varAbs > 0 ? 'text-gray-900' : varAbs < 0 ? 'text-red-600' : 'text-gray-900'
                                                return (
                                                    <React.Fragment key={`ha-te-${month}`}>
                                                        <td className='px-3 py-3 text-right text-gray-900 border-l border-blue-500'>{formatCurrency(previousValue)}</td>
                                                        <td className='px-3 py-3 text-right text-gray-900 font-bold'>{formatCurrency(currentValue)}</td>
                                                        <td className={`px-3 py-3 text-right font-bold ${varColor}`}>{formatCurrency(varAbs)}</td>
                                                        <td className={`px-3 py-3 text-right font-bold ${varColor}`}>{varPct.toFixed(1)}%</td>
                                                    </React.Fragment>
                                                )
                                            })}
                                        </tr>
                                         {/* Línea divisoria */}
                                        <tr>
                                            <td colSpan={(availableMonths.length - 1) * 4 + 1} className='border-t-4 border-black'></td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}

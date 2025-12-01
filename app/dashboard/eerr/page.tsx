'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { EERRData, EERRResponse } from '@/lib/types'

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function EERRPage() {
    const [yearData, setYearData] = useState<{ [month: string]: EERRData } | null>(null)
    const [selectedYear, setSelectedYear] = useState<string>('')
    const [availableYears, setAvailableYears] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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
                const res = await fetch(`/api/data/eerr?year=${selectedYear}`)
                if (!res.ok) throw new Error('Error al cargar datos del año')
                const result: EERRResponse = await res.json()

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
                <Header title='Estado de Resultados (EERR)' subtitle='Cargando datos...' />
                <div className='p-8 flex items-center justify-center'>
                    <div className='text-gray-600 animate-pulse'>Cargando datos...</div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div>
                <Header title='Estado de Resultados (EERR)' subtitle='Error' />
                <div className='p-8'>
                    <Card>
                        <div className='text-red-600'>Error: {error}</div>
                    </Card>
                </div>
            </div>
        )
    }

    if (!yearData) {
        return (
            <div>
                <Header title='Estado de Resultados (EERR)' subtitle='No hay datos' />
                <div className='p-8'>
                    <Card>
                        <div className='text-gray-600'>No hay datos disponibles para este año.</div>
                    </Card>
                </div>
            </div>
        )
    }

    const months = Object.keys(yearData).sort()
    const lineOrder = [
        'ingresosOperacionales',
        'costoVentas',
        'margenBruto',
        'gastosAdmin',
        'depreciacion',
        'resultadoOperacional',
        'ingresosNoOperacionales',
        'gastosNoOperacionales',
        'correccionMonetaria',
        'resultadoAntesImpuestos',
        'impuestoRenta',
        'utilidadPerdida'
    ] as const

    return (
        <div>
            <Header 
                title='Estado de Resultados (EERR)' 
                subtitle={`Comparativo mensual año ${selectedYear}`}
            />

            <div className='p-8 space-y-6'>
                {/* Year Selector */}
                <Card>
                    <div className='flex items-center gap-4'>
                        <Calendar className='w-5 h-5 text-blue-600' />
                        <label className='font-medium text-gray-700'>Seleccionar Año:</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className='px-4 py-2 border border-gray-300 text-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'
                        >
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </Card>

                {/* EERR Table */}
                <Card>
                    <div className='space-y-4'>
                        <h2 className='text-xl font-bold text-gray-800'>
                            Estado de Resultados Comparativo {selectedYear}
                        </h2>

                        <div 
                            className={`overflow-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                            style={{ maxHeight: '70vh' }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUpOrLeave}
                            onMouseLeave={handleMouseUpOrLeave}
                        >
                            <table className='w-full border-collapse text-sm text-gray-800 select-none'>
                                <thead className='sticky top-0 bg-gray-00 z-10'>
                                    <tr>
                                        <th className='border border-gray-300 text-gray-800 px-4 py-3 text-left font-semibold bg-gray-100 sticky left-0 z-20'>
                                            Línea del Estado
                                        </th>
                                        {months.map(month => (
                                            <th key={month} className='border border-gray-300 text-gray-800 px-4 py-3 text-center font-semibold bg-gray-100 min-w-[140px]'>
                                                {MONTH_NAMES[parseInt(month) - 1]}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineOrder.map((lineKey) => {
                                        const firstMonthLine = yearData[months[0]].lines[lineKey]
                                        const isCalculated = firstMonthLine.type === 'calculated'
                                        const isSubtotal = firstMonthLine.level === 1
                                        const isFinalResult = firstMonthLine.level === 2

                                        return (
                                            <tr key={lineKey} className={
                                                isFinalResult ? 'bg-blue-50 font-bold' :
                                                isSubtotal ? 'bg-gray-50 font-semibold' :
                                                isCalculated ? 'bg-gray-50' :
                                                'hover:bg-gray-50'
                                            }>
                                                <td className={`border border-gray-300 px-4 py-2 sticky left-0 bg-white ${
                                                    isFinalResult ? 'bg-blue-50 font-bold' :
                                                    isSubtotal ? 'bg-gray-50 font-semibold' :
                                                    isCalculated ? 'bg-gray-50' : ''
                                                } ${isFinalResult || isSubtotal ? 'text-base' : ''}`}>
                                                    {firstMonthLine.label}
                                                </td>
                                                {months.map(month => {
                                                    const line = yearData[month].lines[lineKey]
                                                    const amount = line.amount
                                                    const isNegative = amount < 0

                                                    return (
                                                        <td key={month} className={`border border-gray-300 px-4 py-2 text-right tabular-nums ${
                                                            isNegative ? 'text-red-600' : 'text-gray-900'
                                                        } ${isFinalResult || isSubtotal ? 'font-semibold' : ''}`}>
                                                            {formatCurrency(amount)}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className='text-xs text-gray-500 italic'>
                            * Arrastra la tabla para navegar horizontalmente y verticalmente
                        </div>
                    </div>
                </Card>

                {/* Summary Cards */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    {months.slice(-3).reverse().map(month => {
                        const data = yearData[month]
                        const isProfit = data.summary.utilidadPerdida >= 0

                        return (
                            <Card key={month}>
                                <div className='space-y-3 bg-gray-50 p-4 rounded-lg'>
                                    <div className='flex items-center justify-between'>
                                        <h3 className='text-lg font-semibold text-gray-700'>
                                            {MONTH_NAMES[parseInt(month) - 1]}
                                        </h3>
                                        {isProfit ? (
                                            <TrendingUp className='w-5 h-5 text-green-600' />
                                        ) : (
                                            <TrendingDown className='w-5 h-5 text-red-600' />
                                        )}
                                    </div>
                                    
                                    <div className='space-y-2 text-sm'>
                                        <div className='flex justify-between'>
                                            <span className='text-gray-600'>Ingresos Op.:</span>
                                            <span className='font-medium text-gray-800'>{formatCurrency(data.summary.ingresosOperacionales)}</span>
                                        </div>
                                        <div className='flex justify-between'>
                                            <span className='text-gray-600'>Margen Bruto:</span>
                                            <span className='font-medium text-gray-800'>{formatCurrency(data.summary.margenBruto)}</span>
                                        </div>
                                        <div className='flex justify-between'>
                                            <span className='text-gray-600'>% Margen Bruto:</span>
                                            <span className='font-medium text-gray-800'>{data.summary.margenBrutoPercentage.toFixed(1)}%</span>
                                        </div>
                                        <div className='flex justify-between pt-2 border-t border-gray-200'>
                                            <span className='text-gray-700 font-semibold'>Resultado Final:</span>
                                            <span className={`font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(data.summary.utilidadPerdida)}
                                            </span>
                                        </div>
                                        <div className='flex justify-between'>
                                            <span className='text-gray-600'>% Margen Neto:</span>
                                            <span className={`font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                                {data.summary.margenNetoPercentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

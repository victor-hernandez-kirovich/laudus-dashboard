'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { Calendar, DollarSign } from 'lucide-react'
import type { CashFlowData, CashFlowMultipleResponse } from '@/lib/types'
import { classifyIndicator } from '@/lib/cash-flow-utils'

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

type TabType = 'general' | 'detallado' | 'indicadores'

export default function FlujoCajaPage() {
  const [yearData, setYearData] = useState<{ [month: string]: CashFlowData } | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('general')

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
        const res = await fetch(`/api/data/flujo-caja?year=${selectedYear}`)
        if (!res.ok) throw new Error('Error al cargar datos del año')
        const result: CashFlowMultipleResponse = await res.json()

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
        <Header title="Flujo de Caja" subtitle="Cargando datos..." />
        <div className="p-8 flex items-center justify-center">
          <div className="text-gray-600 animate-pulse">Cargando datos...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Header title="Flujo de Caja" subtitle="Error" />
        <div className="p-8">
          <Card>
            <div className="text-red-600">Error: {error}</div>
          </Card>
        </div>
      </div>
    )
  }

  if (!yearData) {
    return (
      <div>
        <Header title="Flujo de Caja" subtitle="No hay datos" />
        <div className="p-8">
          <Card>
            <div className="text-gray-600">No hay datos disponibles para este año.</div>
          </Card>
        </div>
      </div>
    )
  }

  const months = Object.keys(yearData).sort()

  // Líneas del flujo de caja en orden
  const lines = [
    { key: 'utilidadNeta', label: 'Utilidad Neta (EERR)', level: 0, type: 'base' },
    { key: 'depreciacion', label: '+ Depreciación', level: 0, type: 'ajuste' },
    { key: 'deltaCxC', label: '- Δ Cuentas por Cobrar', level: 0, type: 'capital' },
    { key: 'deltaInv', label: '- Δ Inventarios', level: 0, type: 'capital' },
    { key: 'deltaCxP', label: '+ Δ Cuentas por Pagar', level: 0, type: 'capital' },
    { key: 'flujoOperativo', label: '= Flujo de Caja Operativo', level: 1, type: 'total' },
  ]

  const renderGeneralView = () => (
    <div
      className={`overflow-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ maxHeight: '70vh' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
    >
      <table className="w-full border-collapse text-sm select-none">
        <thead className="sticky top-0 bg-gray-100 z-30">
          <tr>
            <th className="border border-gray-300 px-4 py-3 text-gray-900 text-left font-semibold bg-blue-50 sticky left-0 z-40">
              Concepto
            </th>
            {months.map((month) => (
              <th key={month} className="border border-gray-300 text-gray-900 px-4 py-3 text-center font-semibold bg-blue-50 min-w-[140px]">
                {MONTH_NAMES[parseInt(month.split('-')[1]) - 1]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const isTotal = line.level === 1
            const bgClass = isTotal
              ? 'bg-green-50 font-bold'
              : 'hover:bg-gray-50'

            return (
              <tr key={line.key} className={`group ${bgClass}`}>
                <td
                  className={`border border-gray-300 text-gray-900 px-4 py-2 sticky left-0 z-[15] ${
                    isTotal ? 'bg-green-50 font-bold' : 'bg-white group-hover:bg-gray-50'
                  }`}
                >
                  {line.label}
                </td>
                {months.map((month) => {
                  const data = yearData[month]
                  let amount = 0

                  switch (line.key) {
                    case 'utilidadNeta':
                      amount = data.operatingCashFlow.utilidadNeta
                      break
                    case 'depreciacion':
                      amount = data.operatingCashFlow.ajustesNoMonetarios.depreciacion
                      break
                    case 'deltaCxC':
                      amount = data.operatingCashFlow.cambiosCapitalTrabajo.cuentasPorCobrar.cambio
                      break
                    case 'deltaInv':
                      amount = data.operatingCashFlow.cambiosCapitalTrabajo.inventarios.cambio
                      break
                    case 'deltaCxP':
                      amount = data.operatingCashFlow.cambiosCapitalTrabajo.cuentasPorPagar.cambio
                      break
                    case 'flujoOperativo':
                      amount = data.operatingCashFlow.total
                      break
                  }

                  const isNegative = amount < 0

                  return (
                    <td
                      key={month}
                      className={`border border-gray-300 px-4 py-2 text-right tabular-nums ${
                        isNegative ? 'text-red-600' : 'text-gray-900'
                      } ${isTotal ? 'font-bold' : ''}`}
                    >
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
  )

  const renderDetalladoView = () => (
    <div
      className={`overflow-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ maxHeight: '70vh' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
    >
      <table className="w-full border-collapse text-sm select-none">
        <thead className="sticky top-0 bg-gray-100 z-30">
          <tr>
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold bg-blue-50 sticky left-0 z-40" rowSpan={2}>
              Concepto
            </th>
            {months.map((month) => (
              <th key={month} colSpan={2} className="border border-gray-300 text-gray-900 px-2 py-2 text-center font-semibold bg-blue-50">
                {MONTH_NAMES[parseInt(month.split('-')[1]) - 1]}
              </th>
            ))}
          </tr>
          <tr>
            {months.map((month) => (
              <React.Fragment key={month}>
                <th className="border border-gray-300 px-2 py-1 text-center text-gray-900 text-xs font-medium bg-blue-50 min-w-[120px]">
                  Valor
                </th>
                <th className="border border-gray-300 px-2 py-1 text-center text-gray-900 text-xs font-medium bg-blue-50 min-w-[80px]">
                  % Utilidad
                </th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const isTotal = line.level === 1
            const bgClass = isTotal ? 'bg-green-50 font-bold' : 'hover:bg-gray-50'

            return (
              <tr key={line.key} className={`group ${bgClass}`}>
                <td
                  className={`border border-gray-300 text-gray-900 px-4 py-2 sticky left-0 z-[15] ${
                    isTotal ? 'bg-green-50 font-bold' : 'bg-white group-hover:bg-gray-50'
                  }`}
                >
                  {line.label}
                </td>
                {months.map((month) => {
                  const data = yearData[month]
                  let amount = 0

                  switch (line.key) {
                    case 'utilidadNeta':
                      amount = data.operatingCashFlow.utilidadNeta
                      break
                    case 'depreciacion':
                      amount = data.operatingCashFlow.ajustesNoMonetarios.depreciacion
                      break
                    case 'deltaCxC':
                      amount = data.operatingCashFlow.cambiosCapitalTrabajo.cuentasPorCobrar.cambio
                      break
                    case 'deltaInv':
                      amount = data.operatingCashFlow.cambiosCapitalTrabajo.inventarios.cambio
                      break
                    case 'deltaCxP':
                      amount = data.operatingCashFlow.cambiosCapitalTrabajo.cuentasPorPagar.cambio
                      break
                    case 'flujoOperativo':
                      amount = data.operatingCashFlow.total
                      break
                  }

                  const percentage = data.operatingCashFlow.utilidadNeta !== 0
                    ? (amount / data.operatingCashFlow.utilidadNeta) * 100
                    : 0
                  const isNegative = percentage < 0

                  return (
                    <React.Fragment key={month}>
                      <td className="border border-gray-300 px-2 py-2 text-right tabular-nums text-gray-900">
                        {formatCurrency(amount)}
                      </td>
                      <td
                        className={`border border-gray-300 px-2 py-2 text-right tabular-nums ${
                          isNegative ? 'text-red-600' : 'text-blue-700'
                        } ${isTotal ? 'font-bold' : 'font-medium'}`}
                      >
                        {percentage.toFixed(1)}%
                      </td>
                    </React.Fragment>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  const renderIndicadoresView = () => (
    <div
      className={`overflow-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ maxHeight: '70vh' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
    >
      <table className="w-full border-collapse text-sm select-none">
        <thead className="sticky top-0 bg-gray-100 z-30">
          <tr>
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold bg-blue-50 sticky left-0 z-40">
              Indicador
            </th>
            {months.map((month) => (
              <th key={month} className="border border-gray-300 text-gray-900 px-4 py-3 text-center font-semibold bg-blue-50 min-w-[140px]">
                {MONTH_NAMES[parseInt(month.split('-')[1]) - 1]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-gray-50">
            <td className="border border-gray-300 text-gray-900 px-4 py-2 sticky left-0 z-[15] bg-white">
              Margen Flujo Operativo
            </td>
            {months.map((month) => {
              const value = yearData[month].indicadores.margenFlujoOperativo
              const classification = classifyIndicator(value, 'margin')
              const colorClass =
                classification === 'excellent'
                  ? 'text-green-600'
                  : classification === 'good'
                  ? 'text-blue-600'
                  : classification === 'warning'
                  ? 'text-yellow-600'
                  : 'text-red-600'

              return (
                <td key={month} className={`border border-gray-300 px-4 py-2 text-right tabular-nums ${colorClass} font-medium`}>
                  {value.toFixed(1)}%
                </td>
              )
            })}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="border border-gray-300 text-gray-900 px-4 py-2 sticky left-0 z-[15] bg-white">
              Calidad de Ingresos
            </td>
            {months.map((month) => {
              const value = yearData[month].indicadores.calidadIngresos
              const classification = classifyIndicator(value, 'quality')
              const colorClass =
                classification === 'excellent'
                  ? 'text-green-600'
                  : classification === 'good'
                  ? 'text-blue-600'
                  : classification === 'warning'
                  ? 'text-yellow-600'
                  : 'text-red-600'

              return (
                <td key={month} className={`border border-gray-300 px-4 py-2 text-right tabular-nums ${colorClass} font-medium`}>
                  {value.toFixed(1)}%
                </td>
              )
            })}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="border border-gray-300 text-gray-900 px-4 py-2 sticky left-0 z-[15] bg-white">
              Días de Efectivo
            </td>
            {months.map((month) => {
              const value = yearData[month].indicadores.diasEfectivoDisponible || 0
              const classification = classifyIndicator(value, 'days')
              const colorClass =
                classification === 'excellent'
                  ? 'text-green-600'
                  : classification === 'good'
                  ? 'text-blue-600'
                  : classification === 'warning'
                  ? 'text-yellow-600'
                  : 'text-red-600'

              return (
                <td key={month} className={`border border-gray-300 px-4 py-2 text-right tabular-nums ${colorClass} font-medium`}>
                  {value > 0 ? `${Math.round(value)} días` : 'N/A'}
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )

  return (
    <div>
      <Header title="Flujo de Caja" subtitle={`Análisis mensual año ${selectedYear}`} />

      <div className="p-8 space-y-6">
        {/* Year Selector */}
        <Card>
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <label className="font-medium text-gray-700">Seleccionar Año:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Tabs */}
        <Card>
          <div className="space-y-4">
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'general'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('detallado')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'detallado'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Analisis Vertical
              </button>
              <button
                onClick={() => setActiveTab('indicadores')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'indicadores'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Indicadores
              </button>
            </div>

            {/* Content */}
            <div className="mt-4">
              {activeTab === 'general' && renderGeneralView()}
              {activeTab === 'detallado' && renderDetalladoView()}
              {activeTab === 'indicadores' && renderIndicadoresView()}
            </div>
          </div>
        </Card>

        {/* Nota informativa */}
        <Card>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Cómo interpretar</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>
                <strong>Flujo Operativo Positivo:</strong> La empresa genera más efectivo del que consume. Excelente señal de salud financiera.
              </p>
              <p>
                <strong>Cambios Negativos en CxC e Inventarios:</strong> Indican dinero no cobrado o invertido en stock. Normal en crecimiento, pero requiere vigilancia.
              </p>
              <p>
                <strong>Cambio Positivo en CxP:</strong> Dinero que aún no se ha pagado a proveedores. Beneficio temporal de liquidez.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

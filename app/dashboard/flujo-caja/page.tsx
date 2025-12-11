'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { Calendar, DollarSign } from 'lucide-react'
import type { CashFlowData, CashFlowMultipleResponse } from '@/lib/types'

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

type TabType = 'general' | 'detallado' | 'horizontal'

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
    // Sección: Flujo de Operación
    { key: 'seccionOperativo', label: 'I. FLUJOS DE OPERACIÓN', level: 2, type: 'header' },
    { key: 'utilidadNeta', label: 'Utilidad Neta (EERR)', level: 0, type: 'base' },
    { key: 'depreciacion', label: '(+) Depreciación', level: 0, type: 'ajuste' },
    { key: 'deltaCxC', label: '(-) Δ Cuentas por Cobrar', level: 0, type: 'capital' },
    { key: 'deltaInv', label: '(-) Δ Inventarios', level: 0, type: 'capital' },
    { key: 'deltaCxP', label: '(+) Δ Cuentas por Pagar', level: 0, type: 'capital' },
    { key: 'flujoOperativo', label: '= Flujo Neto de Operación', level: 1, type: 'subtotal' },
    
    // Sección: Flujo de Inversión
    { key: 'seccionInversion', label: 'II. FLUJOS DE INVERSIÓN', level: 2, type: 'header' },
    { key: 'compraActivosFijos', label: '(-) Compra de Activos Fijos', level: 0, type: 'inversion' },
    { key: 'ventaActivosFijos', label: '(+) Venta de Activos Fijos', level: 0, type: 'inversion' },
    { key: 'compraIntangibles', label: '(-) Compra de Intangibles', level: 0, type: 'inversion' },
    { key: 'ventaIntangibles', label: '(+) Venta de Intangibles', level: 0, type: 'inversion' },
    { key: 'flujoInversion', label: '= Flujo Neto de Inversión', level: 1, type: 'subtotal' },
    
    // Sección: Flujo de Financiamiento
    { key: 'seccionFinanciamiento', label: 'III. FLUJOS DE FINANCIAMIENTO', level: 2, type: 'header' },
    { key: 'prestamosObtenidos', label: '(+) Préstamos Bancarios Obtenidos', level: 0, type: 'financiamiento' },
    { key: 'pagosPrestamos', label: '(-) Pago de Préstamos Bancarios', level: 0, type: 'financiamiento' },
    { key: 'aportesCapital', label: '(+) Aportes de Capital', level: 0, type: 'financiamiento' },
    { key: 'pagoDividendos', label: '(-) Pago de Dividendos', level: 0, type: 'financiamiento' },
    { key: 'movRelacionadas', label: '(+/-) Movimientos con Empresas Relacionadas', level: 0, type: 'financiamiento' },
    { key: 'flujoFinanciamiento', label: '= Flujo Neto de Financiamiento', level: 1, type: 'subtotal' },
    
    // Totales finales
    { key: 'separador', label: '', level: 0, type: 'separator' },
    { key: 'flujoNetoTotal', label: '= AUMENTO/DISMINUCIÓN NETA DEL EFECTIVO', level: 2, type: 'total' },
    { key: 'saldoInicial', label: 'Saldo de Efectivo Inicial', level: 0, type: 'saldo' },
    { key: 'saldoFinal', label: 'SALDO DE EFECTIVO FINAL', level: 2, type: 'total' },
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
            const isHeader = line.type === 'header'
            const isSubtotal = line.type === 'subtotal'
            const isTotal = line.type === 'total'
            const isSeparator = line.type === 'separator'
            
            // Estilos condicionales
            let bgClass = 'hover:bg-gray-50'
            let textClass = ''
            if (isHeader) {
              bgClass = 'bg-blue-100'
              textClass = 'font-bold text-blue-900'
            } else if (isSubtotal) {
              bgClass = 'bg-green-50'
              textClass = 'font-bold'
            } else if (isTotal) {
              bgClass = 'bg-yellow-50'
              textClass = 'font-bold text-gray-900'
            } else if (isSeparator) {
              bgClass = 'bg-gray-200'
            }

            if (isSeparator) {
              return (
                <tr key={line.key} className={bgClass}>
                  <td className="border border-gray-300 px-4 py-1 sticky left-0 z-[15] bg-gray-200" colSpan={months.length + 1}>
                    &nbsp;
                  </td>
                </tr>
              )
            }

            return (
              <tr key={line.key} className={`group ${bgClass}`}>
                <td
                  className={`border border-gray-300 text-gray-900 px-4 py-2 sticky left-0 z-[15] ${textClass} ${
                    isHeader ? 'bg-blue-100' : isSubtotal ? 'bg-green-50' : isTotal ? 'bg-yellow-50' : 'bg-white group-hover:bg-gray-50'
                  }`}
                >
                  {line.label}
                </td>
                {months.map((month) => {
                  const data = yearData[month]

                  // Si es header, no mostrar valores
                  if (isHeader) {
                    return (
                      <td key={month} className="border border-gray-300 px-4 py-2 text-center bg-blue-100">
                        &nbsp;
                      </td>
                    )
                  }

                  const amount = getLineValue(data, line.key)
                  const isNegative = amount < 0

                  return (
                    <td
                      key={month}
                      className={`border border-gray-300 px-4 py-2 text-right tabular-nums ${
                        isNegative ? 'text-red-600' : 'text-gray-900'
                      } ${isSubtotal || isTotal ? 'font-bold' : ''} ${
                        isSubtotal ? 'bg-green-50' : isTotal ? 'bg-yellow-50' : ''
                      }`}
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
                  % Flujo Neto
                </th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const isHeader = line.type === 'header'
            const isSubtotal = line.type === 'subtotal'
            const isTotal = line.type === 'total'
            const isSeparator = line.type === 'separator'
            
            // Estilos condicionales
            let bgClass = 'hover:bg-gray-50'
            let textClass = ''
            if (isHeader) {
              bgClass = 'bg-blue-100'
              textClass = 'font-bold text-blue-900'
            } else if (isSubtotal) {
              bgClass = 'bg-green-50'
              textClass = 'font-bold'
            } else if (isTotal) {
              bgClass = 'bg-yellow-50'
              textClass = 'font-bold text-gray-900'
            } else if (isSeparator) {
              bgClass = 'bg-gray-200'
            }

            if (isSeparator) {
              return (
                <tr key={line.key} className={bgClass}>
                  <td className="border border-gray-300 px-4 py-1 sticky left-0 z-[15] bg-gray-200" colSpan={months.length * 2 + 1}>
                    &nbsp;
                  </td>
                </tr>
              )
            }

            return (
              <tr key={line.key} className={`group ${bgClass}`}>
                <td
                  className={`border border-gray-300 text-gray-900 px-4 py-2 sticky left-0 z-[15] ${textClass} ${
                    isHeader ? 'bg-blue-100' : isSubtotal ? 'bg-green-50' : isTotal ? 'bg-yellow-50' : 'bg-white group-hover:bg-gray-50'
                  }`}
                >
                  {line.label}
                </td>
                {months.map((month) => {
                  const data = yearData[month]

                  // Si es header, no mostrar valores
                  if (isHeader) {
                    return (
                      <React.Fragment key={month}>
                        <td className="border border-gray-300 px-2 py-2 text-center bg-blue-100" colSpan={2}>
                          &nbsp;
                        </td>
                      </React.Fragment>
                    )
                  }

                  const amount = getLineValue(data, line.key)
                  
                  // Calcular porcentaje respecto al flujo neto total
                  const percentage = data.flujoNetoTotal !== 0
                    ? (amount / Math.abs(data.flujoNetoTotal)) * 100
                    : 0
                  const isNegative = amount < 0

                  return (
                    <React.Fragment key={month}>
                      <td className={`border border-gray-300 px-2 py-2 text-right tabular-nums ${
                        isNegative ? 'text-red-600' : 'text-gray-900'
                      } ${isSubtotal || isTotal ? 'font-bold' : ''} ${
                        isSubtotal ? 'bg-green-50' : isTotal ? 'bg-yellow-50' : ''
                      }`}>
                        {formatCurrency(amount)}
                      </td>
                      <td
                        className={`border border-gray-300 px-2 py-2 text-right tabular-nums ${
                          isNegative ? 'text-red-600' : 'text-blue-700'
                        } ${isSubtotal || isTotal ? 'font-bold' : 'font-medium'} ${
                          isSubtotal ? 'bg-green-50' : isTotal ? 'bg-yellow-50' : ''
                        }`}
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

  // Función helper para obtener el valor de una línea
  const getLineValue = (data: CashFlowData, lineKey: string): number => {
    switch (lineKey) {
      // Flujo Operativo
      case 'utilidadNeta':
        return data.operatingCashFlow.utilidadNeta
      case 'depreciacion':
        return data.operatingCashFlow.ajustesNoMonetarios.depreciacion
      case 'deltaCxC':
        return data.operatingCashFlow.cambiosCapitalTrabajo.cuentasPorCobrar.cambio
      case 'deltaInv':
        return data.operatingCashFlow.cambiosCapitalTrabajo.inventarios.cambio
      case 'deltaCxP':
        return data.operatingCashFlow.cambiosCapitalTrabajo.cuentasPorPagar.cambio
      case 'flujoOperativo':
        return data.operatingCashFlow.total
      
      // Flujo de Inversión (método indirecto - estimaciones)
      case 'compraActivosFijos':
        // Compras = cambio en AF + depreciación (si es positivo, hubo compras)
        const comprasAF = data.investmentCashFlow?.comprasNetasEstimadas || 0
        return comprasAF > 0 ? -comprasAF : 0
      case 'ventaActivosFijos':
        // Si compras netas es negativo, hubo ventas netas
        const ventasAF = data.investmentCashFlow?.comprasNetasEstimadas || 0
        return ventasAF < 0 ? -ventasAF : 0
      case 'compraIntangibles':
        return 0 // No tenemos datos de intangibles en el balance
      case 'ventaIntangibles':
        return 0 // No tenemos datos de intangibles en el balance
      case 'flujoInversion':
        return data.investmentCashFlow?.total || 0
      
      // Flujo de Financiamiento (método indirecto - estimaciones)
      case 'prestamosObtenidos':
        const cambioDeudas = data.financingCashFlow?.cambioDeudas || 0
        return cambioDeudas > 0 ? cambioDeudas : 0
      case 'pagosPrestamos':
        const pagoDeudas = data.financingCashFlow?.cambioDeudas || 0
        return pagoDeudas < 0 ? pagoDeudas : 0
      case 'aportesCapital':
        const cambioPatrimonio = data.financingCashFlow?.cambioPatrimonio || 0
        return cambioPatrimonio > 0 ? cambioPatrimonio : 0
      case 'pagoDividendos':
        const retiros = data.financingCashFlow?.cambioPatrimonio || 0
        return retiros < 0 ? retiros : 0
      case 'movRelacionadas':
        return 0 // No tenemos datos de empresas relacionadas
      case 'flujoFinanciamiento':
        return data.financingCashFlow?.total || 0
      
      // Totales
      case 'flujoNetoTotal':
        return data.flujoNetoTotal
      case 'saldoInicial':
        return data.saldoEfectivoInicial || 0
      case 'saldoFinal':
        return data.saldoEfectivoFinal || 0
      default:
        return 0
    }
  }

  const renderHorizontalView = () => (
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
              <th key={month} colSpan={3} className="border border-gray-300 text-gray-900 px-2 py-2 text-center font-semibold bg-blue-50">
                {MONTH_NAMES[parseInt(month.split('-')[1]) - 1]}
              </th>
            ))}
          </tr>
          <tr>
            {months.map((month) => (
              <React.Fragment key={month}>
                <th className="border border-gray-300 px-2 py-1 text-center text-gray-900 text-xs font-medium bg-blue-50 min-w-[100px]">
                  Valor
                </th>
                <th className="border border-gray-300 px-2 py-1 text-center text-gray-900 text-xs font-medium bg-blue-50 min-w-[90px]">
                  Var. $
                </th>
                <th className="border border-gray-300 px-2 py-1 text-center text-gray-900 text-xs font-medium bg-blue-50 min-w-[70px]">
                  Var. %
                </th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const isHeader = line.type === 'header'
            const isSubtotal = line.type === 'subtotal'
            const isTotal = line.type === 'total'
            const isSeparator = line.type === 'separator'
            
            // Estilos condicionales
            let bgClass = 'hover:bg-gray-50'
            let textClass = ''
            if (isHeader) {
              bgClass = 'bg-blue-100'
              textClass = 'font-bold text-blue-900'
            } else if (isSubtotal) {
              bgClass = 'bg-green-50'
              textClass = 'font-bold'
            } else if (isTotal) {
              bgClass = 'bg-yellow-50'
              textClass = 'font-bold text-gray-900'
            } else if (isSeparator) {
              bgClass = 'bg-gray-200'
            }

            if (isSeparator) {
              return (
                <tr key={line.key} className={bgClass}>
                  <td className="border border-gray-300 px-4 py-1 sticky left-0 z-[15] bg-gray-200" colSpan={months.length * 3 + 1}>
                    &nbsp;
                  </td>
                </tr>
              )
            }

            return (
              <tr key={line.key} className={`group ${bgClass}`}>
                <td
                  className={`border border-gray-300 text-gray-900 px-4 py-2 sticky left-0 z-[15] ${textClass} ${
                    isHeader ? 'bg-blue-100' : isSubtotal ? 'bg-green-50' : isTotal ? 'bg-yellow-50' : 'bg-white group-hover:bg-gray-50'
                  }`}
                >
                  {line.label}
                </td>
                {months.map((month, index) => {
                  const data = yearData[month]

                  // Si es header, no mostrar valores
                  if (isHeader) {
                    return (
                      <React.Fragment key={month}>
                        <td className="border border-gray-300 px-2 py-2 text-center bg-blue-100" colSpan={3}>
                          &nbsp;
                        </td>
                      </React.Fragment>
                    )
                  }

                  const amount = getLineValue(data, line.key)
                  
                  // Obtener mes anterior
                  const previousMonth = index > 0 ? months[index - 1] : null
                  const previousData = previousMonth ? yearData[previousMonth] : null
                  const previousAmount = previousData ? getLineValue(previousData, line.key) : null
                  
                  // Calcular variaciones
                  const variacionAbsoluta = previousAmount !== null ? amount - previousAmount : null
                  const variacionPorcentaje = previousAmount !== null && previousAmount !== 0
                    ? ((amount - previousAmount) / Math.abs(previousAmount)) * 100
                    : null

                  const isNegative = amount < 0
                  const varAbsNegative = variacionAbsoluta !== null && variacionAbsoluta < 0
                  const varPctNegative = variacionPorcentaje !== null && variacionPorcentaje < 0

                  return (
                    <React.Fragment key={month}>
                      {/* Valor */}
                      <td className={`border border-gray-300 px-2 py-2 text-right tabular-nums ${
                        isNegative ? 'text-red-600' : 'text-gray-900'
                      } ${isSubtotal || isTotal ? 'font-bold' : ''} ${
                        isSubtotal ? 'bg-green-50' : isTotal ? 'bg-yellow-50' : ''
                      }`}>
                        {formatCurrency(amount)}
                      </td>
                      {/* Variación Absoluta */}
                      <td className={`border border-gray-300 px-2 py-2 text-right tabular-nums ${
                        variacionAbsoluta === null 
                          ? 'text-gray-400' 
                          : varAbsNegative 
                            ? 'text-red-600' 
                            : 'text-green-600'
                      } ${isSubtotal || isTotal ? 'font-bold' : 'font-medium'} ${
                        isSubtotal ? 'bg-green-50' : isTotal ? 'bg-yellow-50' : ''
                      }`}>
                        {variacionAbsoluta === null 
                          ? '-' 
                          : `${variacionAbsoluta >= 0 ? '+' : ''}${formatCurrency(variacionAbsoluta)}`}
                      </td>
                      {/* Variación Porcentual */}
                      <td className={`border border-gray-300 px-2 py-2 text-right tabular-nums ${
                        variacionPorcentaje === null 
                          ? 'text-gray-400' 
                          : varPctNegative 
                            ? 'text-red-600' 
                            : 'text-green-600'
                      } ${isSubtotal || isTotal ? 'font-bold' : 'font-medium'} ${
                        isSubtotal ? 'bg-green-50' : isTotal ? 'bg-yellow-50' : ''
                      }`}>
                        {variacionPorcentaje === null 
                          ? '-' 
                          : `${variacionPorcentaje >= 0 ? '+' : ''}${variacionPorcentaje.toFixed(1)}%`}
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
                onClick={() => setActiveTab('horizontal')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'horizontal'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Analisis Horizontal
              </button>
            </div>

            {/* Content */}
            <div className="mt-4">
              {activeTab === 'general' && renderGeneralView()}
              {activeTab === 'detallado' && renderDetalladoView()}
              {activeTab === 'horizontal' && renderHorizontalView()}
            </div>
          </div>
        </Card>

        {/* Nota informativa */}
        <Card>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Cómo interpretar el Estado de Flujo de Efectivo</h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div>
                <strong className="text-blue-900">I. Flujos de Operación:</strong>
                <p className="ml-4">Efectivo generado por las operaciones del negocio. Parte de la utilidad neta y ajusta por partidas que no representan movimiento de efectivo.</p>
              </div>
              <div>
                <strong className="text-blue-900">II. Flujos de Inversión:</strong>
                <p className="ml-4">Compra y venta de activos de largo plazo. Negativo indica inversión en crecimiento; positivo indica desinversión.</p>
              </div>
              <div>
                <strong className="text-blue-900">III. Flujos de Financiamiento:</strong>
                <p className="ml-4">Obtención y pago de préstamos, aportes de capital y pago de dividendos. Muestra cómo se financia la empresa.</p>
              </div>
              <div className="pt-2 border-t border-blue-200">
                <strong className="text-blue-900">📌 Nota sobre estimaciones:</strong>
                <p className="ml-4">Al usar el método indirecto, algunos valores de inversión y financiamiento son estimaciones basadas en cambios del balance. Para un detalle exacto se requiere información de transacciones individuales.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

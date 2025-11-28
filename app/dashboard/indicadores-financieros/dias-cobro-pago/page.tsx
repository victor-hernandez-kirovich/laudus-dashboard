'use client'

import { useState, useEffect } from 'react'
import { DiasCoboPagoChart } from '@/components/charts/DiasCoboPagoChart'

interface Balance8ColumnsRow {
  accountId: string
  accountNumber: string
  accountName: string
  debit: number
  credit: number
  assets: number
  liabilities: number
  incomes: number
  expenses: number
}

interface Balance8ColumnsDocument {
  date: string
  data: Balance8ColumnsRow[]
}

interface DiasCoboPagoData {
  date: string
  diasCobro: number
  diasPago: number
  cuentasPorCobrar: number
  cuentasPorPagar: number
  ingresos: number
  costoVentas: number
  gap: number
}

export default function DiasCobroPagoPage() {
  const [chartData, setChartData] = useState<DiasCoboPagoData[]>([])
  const [allData, setAllData] = useState<DiasCoboPagoData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(0)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/data/8columns')
      
      if (!response.ok) {
        throw new Error('Error al obtener datos del balance')
      }

      const result = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error('Formato de respuesta inválido')
      }

      const rawData: Balance8ColumnsDocument[] = result.data
      
      // Primero calcular indicadores con TODOS los datos (para tener el contexto de meses anteriores)
      const calculatedData = calculateDiasCoboPago(rawData)
      
      // Luego filtrar por datos mensuales (último día de cada mes)
      const filterMonthlyCalculated = (data: DiasCoboPagoData[]) => {
        const monthlyMap = new Map()
        
        data.forEach(record => {
          const monthKey = record.date.substring(0, 7) // YYYY-MM
          const existing = monthlyMap.get(monthKey)
          
          // Quedarnos con el último día del mes (fecha más reciente)
          if (!existing || record.date > existing.date) {
            monthlyMap.set(monthKey, record)
          }
        })
        
        // Convertir a array y ordenar cronológicamente
        return Array.from(monthlyMap.values()).sort((a, b) => 
          a.date.localeCompare(b.date)
        )
      }

      const monthlyCalculatedData = filterMonthlyCalculated(calculatedData)
      
      // Ordenar por fecha ascendente (enero a diciembre) y almacenar todos los datos
      const sortedData = monthlyCalculatedData.sort((a, b) => a.date.localeCompare(b.date))
      setAllData(sortedData)
      
      // Establecer el año más reciente como seleccionado
      if (sortedData.length > 0) {
        const mostRecentYear = new Date(sortedData[0].date).getFullYear()
        setSelectedYear(mostRecentYear)
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setLoading(false)
    }
  }

  // Obtener años disponibles
  const availableYears = Array.from(
    new Set(allData.map(d => new Date(d.date).getFullYear()))
  ).sort((a, b) => b - a)

  // Filtrar datos por año seleccionado
  const filteredData = allData.filter(d => {
    const year = new Date(d.date).getFullYear()
    return year === selectedYear
  })

  const calculateDiasCoboPago = (documents: Balance8ColumnsDocument[]): DiasCoboPagoData[] => {
    return documents.map((doc, index) => {
      const data = doc.data || []

      // 1. CALCULAR CUENTAS POR COBRAR
      const cxcRows = data.filter(row => 
        row.accountName?.toLowerCase().includes('cuentas por cobrar')
      )
      const cuentasPorCobrar = cxcRows.reduce((sum, row) => {
        return sum + ((row.debit || 0) - (row.credit || 0))
      }, 0)

      // 2. CALCULAR CUENTAS POR PAGAR
      const cxpRows = data.filter(row => 
        row.accountName?.toLowerCase().includes('cuentas por pagar')
      )
      const cuentasPorPagar = cxpRows.reduce((sum, row) => {
        return sum + ((row.credit || 0) - (row.debit || 0))
      }, 0)

      // 3. CALCULAR INGRESOS (código 4xxx)
      const ingresosRows = data.filter(row => {
        const code = parseInt(row.accountNumber)
        return code >= 4000 && code < 5000
      })
      const ingresos = ingresosRows.reduce((sum, row) => sum + (row.incomes || 0), 0)

      // 4. CALCULAR INVENTARIO
      const inventarioRows = data.filter(row => {
        const nombre = row.accountName?.toLowerCase() || ''
        return nombre.includes('inventario') || nombre.includes('existencia')
      })
      const inventario = inventarioRows.reduce((sum, row) => {
        return sum + ((row.debit || 0) - (row.credit || 0))
      }, 0)

      // 5. CALCULAR COMPRAS/GASTOS (código 3xxx)
      const comprasRows = data.filter(row => {
        const code = parseInt(row.accountNumber)
        return code >= 3000 && code < 4000
      })
      const compras = comprasRows.reduce((sum, row) => sum + (row.expenses || 0), 0)

      // 6. APROXIMAR COSTO DE VENTAS
      // Para mejorar la precisión, usamos variación de inventario si hay documentos previos
      let costoVentas = compras

      if (index < documents.length - 1) {
        // Hay un documento anterior, calcular variación
        const docAnterior = documents[index + 1]
        const dataAnterior = docAnterior.data || []
        
        const inventarioAnteriorRows = dataAnterior.filter(row => {
          const nombre = row.accountName?.toLowerCase() || ''
          return nombre.includes('inventario') || nombre.includes('existencia')
        })
        const inventarioAnterior = inventarioAnteriorRows.reduce((sum, row) => {
          return sum + ((row.debit || 0) - (row.credit || 0))
        }, 0)

        const variacionInventario = inventarioAnterior - inventario
        costoVentas = compras + variacionInventario
      }

      // 7. CALCULAR DÍAS DE COBRO Y PAGO
      const diasCobro = ingresos > 0 ? (cuentasPorCobrar * 360) / ingresos : 0
      const diasPago = costoVentas > 0 ? (cuentasPorPagar * 360) / costoVentas : 0
      const gap = diasCobro - diasPago

      return {
        date: doc.date,
        diasCobro,
        diasPago,
        cuentasPorCobrar,
        cuentasPorPagar,
        ingresos,
        costoVentas,
        gap
      }
    })
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md'>
          <h2 className='text-red-800 font-bold text-lg mb-2'>Error</h2>
          <p className='text-red-600'>{error}</p>
        </div>
      </div>
    )
  }



  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900'>Días de Cobro y Pago</h1>
        <p className='text-gray-600 mt-2'>
          Análisis del ciclo de conversión de efectivo y gestión del capital de trabajo
        </p>
      </div>

      {/* Selector de Año */}
      <div className='mb-6 flex justify-end'>
        <div className='flex items-center gap-2'>
          <label htmlFor='year-select' className='text-sm font-medium text-gray-700'>
            Año:
          </label>
          <select
            id='year-select'
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className='rounded-md border-2 border-gray-400 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Validación de datos filtrados */}
      {filteredData.length === 0 ? (
        <div className='bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center'>
          <h2 className='text-yellow-800 font-bold text-lg mb-2'>Sin Datos</h2>
          <p className='text-yellow-600'>No se encontraron datos para el año {selectedYear}</p>
        </div>
      ) : (
        <>
          <DiasCoboPagoChart data={filteredData} />

      {/* Información adicional */}
      <div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <h3 className='font-semibold text-blue-900 mb-2'>📚 Sobre los Días de Cobro (DSO)</h3>
          <p className='text-sm text-blue-800 mb-2'>
            El DSO (Days Sales Outstanding) mide el tiempo promedio que tarda una empresa en cobrar después de realizar una venta.
          </p>
          <ul className='text-sm text-blue-700 space-y-1 list-disc list-inside'>
            <li>Un DSO alto indica problemas de cobranza</li>
            <li>Un DSO bajo sugiere buena gestión crediticia</li>
            <li>El valor óptimo depende del sector y políticas de crédito</li>
          </ul>
        </div>

        <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
          <h3 className='font-semibold text-purple-900 mb-2'>📚 Sobre los Días de Pago (DPO)</h3>
          <p className='text-sm text-purple-800 mb-2'>
            El DPO (Days Payables Outstanding) mide el tiempo promedio que tarda una empresa en pagar a sus proveedores.
          </p>
          <ul className='text-sm text-purple-700 space-y-1 list-disc list-inside'>
            <li>Un DPO alto puede indicar buena negociación con proveedores</li>
            <li>Un DPO muy bajo puede afectar el flujo de caja</li>
            <li>Debe balancearse para mantener buenas relaciones comerciales</li>
          </ul>
        </div>
      </div>

      {/* Nota metodológica */}
      <div className='mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4'>
        <h3 className='font-semibold text-orange-900 mb-2'>⚠️ Nota Metodológica</h3>
        <p className='text-sm text-orange-800'>
          El <strong>Costo de Ventas</strong> se aproxima mediante la fórmula: <code className='bg-white px-2 py-1 rounded'>Compras + (Inventario Inicial - Inventario Final)</code>.
          Esto es necesario debido a que el balance de 8 columnas no incluye directamente esta partida del estado de resultados.
          Para mayor precisión, se recomienda usar el Estado de Resultados completo cuando esté disponible.
        </p>
      </div>
        </>
      )}
    </div>
  )
}

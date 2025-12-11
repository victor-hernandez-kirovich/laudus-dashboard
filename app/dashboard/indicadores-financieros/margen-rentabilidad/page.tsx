'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { MargenRentabilidadChart } from '@/components/charts/MargenRentabilidadChart'

interface MargenData {
  date: string
  margenNeto: number
  margenOperacional: number
  ingresos: number
  gastos: number
  gastosOperacionales: number
  utilidadNeta: number
  utilidadOperacional: number
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default function MargenRentabilidadPage() {
  const [eerrData, setEerrData] = useState<{ [key: string]: any } | null>(null)
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [monthsAvailable, setMonthsAvailable] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>('')

  // Cargar años disponibles al inicio
  useEffect(() => {
    async function fetchAvailableYears() {
      try {
        // Primero obtenemos los años disponibles desde balance-general
        const res = await fetch('/api/data/balance-general')
        if (!res.ok) throw new Error('Error al cargar años disponibles')
        const result = await res.json()
        
        if (result.availableYears && result.availableYears.length > 0) {
          setAvailableYears(result.availableYears)
          setSelectedYear(result.availableYears[0])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setLoading(false)
      }
    }
    fetchAvailableYears()
  }, [])

  // Cargar datos del EERR cuando cambie el año seleccionado
  useEffect(() => {
    if (!selectedYear) return

    async function fetchEerrData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/data/eerr?year=${selectedYear}`)
        if (!res.ok) throw new Error('Error al cargar datos del Estado de Resultados')
        const result = await res.json()
        
        if (result.success && result.data) {
          setEerrData(result.data)
          setMonthsAvailable(result.monthsAvailable || [])
        } else {
          setEerrData(null)
          setMonthsAvailable([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchEerrData()
  }, [selectedYear])

  // Calcular Márgenes de Rentabilidad desde el Estado de Resultados
  const calculateMargenRentabilidad = (): MargenData[] => {
    if (!eerrData || monthsAvailable.length === 0) return []

    return monthsAvailable.map(month => {
      const monthData = eerrData[month]
      if (!monthData || !monthData.summary) {
        return {
          date: `${selectedYear}-${month}-01`,
          margenNeto: 0,
          margenOperacional: 0,
          ingresos: 0,
          gastos: 0,
          gastosOperacionales: 0,
          utilidadNeta: 0,
          utilidadOperacional: 0
        }
      }

      const summary = monthData.summary
      
      // Datos del Estado de Resultados
      const ingresos = summary.ingresosOperacionales || 0
      const costoVentas = summary.costoVentas || 0
      const gastosAdmin = summary.gastosAdmin || 0
      const depreciacion = summary.depreciacion || 0
      const utilidadNeta = summary.utilidadPerdida || 0
      const utilidadOperacional = summary.resultadoOperacional || 0
      
      // Total de gastos operacionales = Costo de Ventas + Gastos Admin + Depreciación
      const gastosOperacionales = costoVentas + gastosAdmin + depreciacion
      
      // Total de gastos (incluyendo no operacionales e impuestos)
      const gastosNoOperacionales = summary.gastosNoOperacionales || 0
      const correccionMonetaria = summary.correccionMonetaria || 0
      const impuestoRenta = summary.impuestoRenta || 0
      const gastosTotales = gastosOperacionales + gastosNoOperacionales + correccionMonetaria + impuestoRenta
      
      // Calcular Margen Neto = (Utilidad Neta / Ingresos Operacionales) * 100
      const margenNeto = ingresos > 0 ? (utilidadNeta / ingresos) * 100 : 0
      
      // Calcular Margen Operacional = (Resultado Operacional / Ingresos Operacionales) * 100
      const margenOperacional = ingresos > 0 ? (utilidadOperacional / ingresos) * 100 : 0
      
      return {
        date: `${selectedYear}-${month}-01`,
        margenNeto: margenNeto,
        margenOperacional: margenOperacional,
        ingresos: ingresos,
        gastos: gastosTotales,
        gastosOperacionales: gastosOperacionales,
        utilidadNeta: utilidadNeta,
        utilidadOperacional: utilidadOperacional
      }
    })
  }

  if (loading) {
    return (
      <div>
        <Header title='Margen de Rentabilidad' subtitle='Análisis de rentabilidad desde el Estado de Resultados' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-600'>Cargando datos...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Header title='Margen de Rentabilidad' subtitle='Análisis de rentabilidad desde el Estado de Resultados' />
        <div className='p-8'>
          <Card>
            <div className='text-red-600'>Error: {error}</div>
          </Card>
        </div>
      </div>
    )
  }

  if (availableYears.length === 0) {
    return (
      <div>
        <Header title='Margen de Rentabilidad' subtitle='No hay datos disponibles' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-500'>No se encontraron datos</div>
        </div>
      </div>
    )
  }

  const margenData = calculateMargenRentabilidad()

  return (
    <div>
      <Header
        title='Margen de Rentabilidad'
        subtitle='Análisis del margen de utilidad desde el Estado de Resultados (EERR)'
      />

      <div className='p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8'>
        {/* Selector de Año */}
        <div className='flex justify-end'>
          <div className='flex items-center gap-2'>
            <label htmlFor='year-select' className='text-sm font-medium text-gray-700'>
              Año:
            </label>
            <select
              id='year-select'
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
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
        {margenData.length === 0 ? (
          <div className='p-8 text-center text-gray-500'>
            No se encontraron datos para el año {selectedYear}
          </div>
        ) : (
          <MargenRentabilidadChart data={margenData} />
        )}
      </div>
    </div>
  )
}

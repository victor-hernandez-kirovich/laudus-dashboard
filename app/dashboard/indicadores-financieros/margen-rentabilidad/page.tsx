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

export default function MargenRentabilidadPage() {
  const [allData, setAllData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(0)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data/8columns')
        if (!res.ok) throw new Error('Error al cargar datos')
        const result = await res.json()
        const sortedData = (result.data || []).sort((a: any, b: any) => 
          b.date.localeCompare(a.date)
        )
        setAllData(sortedData)
        
        // Establecer el año más reciente como seleccionado
        if (sortedData.length > 0) {
          const mostRecentYear = new Date(sortedData[0].date).getFullYear()
          setSelectedYear(mostRecentYear)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Obtener años disponibles
  const availableYears = Array.from(
    new Set(allData.map(d => new Date(d.date).getFullYear()))
  ).sort((a, b) => b - a)

  // Filtrar datos por año seleccionado
  const filteredData = allData.filter(d => {
    const year = new Date(d.date).getFullYear()
    return year === selectedYear
  })

  // Calcular Márgenes de Rentabilidad (Neto y Operacional) para cada fecha
  const calculateMargenRentabilidad = (): MargenData[] => {
    return filteredData.map(record => {
      const records = record.data || []
      
      // Buscar la fila "Sumas" que contiene los totales
      const filaSumas = records.find((r: any) => r.accountName === "Sumas")
      
      // Buscar cuentas específicas para Margen Operacional
      const cuenta31 = records.find((r: any) => r.accountNumber === "31") // Costo de Explotación
      const cuenta32 = records.find((r: any) => r.accountNumber === "32") // Gastos Operacionales
      
      if (!filaSumas) {
        return {
          date: record.date,
          margenNeto: 0,
          margenOperacional: 0,
          ingresos: 0,
          gastos: 0,
          gastosOperacionales: 0,
          utilidadNeta: 0,
          utilidadOperacional: 0
        }
      }
      
      const ingresos = filaSumas.incomes || 0
      const gastos = filaSumas.expenses || 0
      const utilidadNeta = ingresos - gastos
      
      // Calcular Margen Neto = (Utilidad Neta / Ingresos) * 100
      const margenNeto = ingresos > 0 ? (utilidadNeta / ingresos) * 100 : 0
      
      // Calcular Margen Operacional = (Ingresos - Gastos Operacionales) / Ingresos * 100
      const costoExplotacion = cuenta31?.expenses || 0
      const gastosOperacionales = cuenta32?.expenses || 0
      const totalGastosOperacionales = costoExplotacion + gastosOperacionales
      const utilidadOperacional = ingresos - totalGastosOperacionales
      const margenOperacional = ingresos > 0 ? (utilidadOperacional / ingresos) * 100 : 0
      
      return {
        date: record.date,
        margenNeto: margenNeto,
        margenOperacional: margenOperacional,
        ingresos: ingresos,
        gastos: gastos,
        gastosOperacionales: totalGastosOperacionales,
        utilidadNeta: utilidadNeta,
        utilidadOperacional: utilidadOperacional
      }
    })
  }

  if (loading) {
    return (
      <div>
        <Header title='Margen de Rentabilidad' subtitle='Análisis de rentabilidad neta' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-600'>Cargando datos...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Header title='Margen de Rentabilidad' subtitle='Análisis de rentabilidad neta' />
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
        subtitle='Análisis del margen de utilidad neta sobre las ventas'
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
        {margenData.length === 0 ? (
          <div className='p-8 text-center text-gray-500'>
            No se encontraron datos para el año {selectedYear}
          </div>
        ) : (
          <MargenRentabilidadChart data={margenData.slice(0, 12)} />
        )}
      </div>
    </div>
  )
}

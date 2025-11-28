'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { CurrentRatioChart } from '@/components/charts/RatioCirculanteChart'

export default function RatioCirculantePage() {
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
        console.error(err)
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

  const calculateRatios = () => {
    if (!filteredData || filteredData.length === 0) return []
    return filteredData.map((record: any) => {
      const records = record.data || []
      
      // Buscar Activos Corrientes (accountNumber "11")
      const activos = records.find((r: any) => r.accountNumber === '11')?.assets || 0
      
      // Buscar Pasivos Corrientes (accountNumber "21")
      const pasivos = records.find((r: any) => r.accountNumber === '21')?.liabilities || 0
      
      // Buscar Inventarios/Existencias (accountNumber "1109")
      const inventarios = records.find((r: any) => r.accountNumber === '1109')?.assets || 0
      
      // Calcular Current Ratio
      const ratio = pasivos > 0 ? activos / pasivos : 0
      
      // Calcular Prueba Ácida
      const acidTest = pasivos > 0 ? (activos - inventarios) / pasivos : 0
      
      return { 
        date: record.date, 
        ratio, 
        acidTest,
        activos, 
        pasivos,
        inventarios
      }
    })
  }

  const filterMonthlyData = (data: any[]) => {
    if (!data || data.length === 0) return []
    
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

  const allRatios = calculateRatios()
  const data = filterMonthlyData(allRatios)

  return (
    <div>
      <Header title='Ratio de Liquidez'  />
      <div className='p-4 sm:p-6 lg:p-8'>
        <Card>
          {loading ? (
            <div className='p-8 text-center text-gray-600'>Cargando datos...</div>
          ) : error ? (
            <div className='p-8 text-center text-red-600'>Error: {error}</div>
          ) : (
            <>
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
              {data.length === 0 ? (
                <div className='p-8 text-center text-gray-500'>
                  No se encontraron datos para el año {selectedYear}
                </div>
              ) : (
                <div>
                  <div className='mb-4 text-sm text-gray-600'>Última actualización: {new Date(data[0].date).toLocaleDateString('es-CL')}</div>
                  <CurrentRatioChart data={data} />
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

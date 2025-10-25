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

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data/8columns')
        if (!res.ok) throw new Error('Error al cargar datos')
        const result = await res.json()
        setAllData(result.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const calculateRatios = () => {
    if (!allData || allData.length === 0) return []
    return allData.map((record: any) => {
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

  const data = calculateRatios()

  return (
    <div>
      <Header title='Ratio de Liquidez'  />
      <div className='p-4 sm:p-6 lg:p-8'>
        <Card>
          {loading ? (
            <div className='p-8 text-center text-gray-600'>Cargando datos...</div>
          ) : error ? (
            <div className='p-8 text-center text-red-600'>Error: {error}</div>
          ) : data.length === 0 ? (
            <div className='p-8 text-center text-gray-500'>No hay datos disponibles</div>
          ) : (
            <div>
              <div className='mb-4 text-sm text-gray-600'>Última actualización: {new Date(data[0].date).toLocaleDateString('es-CL')}</div>
              <CurrentRatioChart data={data} />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

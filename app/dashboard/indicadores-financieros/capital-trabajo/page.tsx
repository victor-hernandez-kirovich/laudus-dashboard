'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { WorkingCapitalChart } from '@/components/charts/CapitalTrabajoChart'

export default function CapitalTrabajoPage() {
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

  const calculateWorkingCapital = () => {
    if (!allData || allData.length === 0) return []
    return allData.map((record: any) => {
      const records = record.data || []
      const activos = records.find((r: any) => r.accountNumber === '11')?.assets || 0
      const pasivos = records.find((r: any) => r.accountNumber === '21')?.liabilities || 0
      const workingCapital = activos - pasivos
      return { date: record.date, workingCapital, activosCorrientes: activos, pasivosCorrientes: pasivos }
    })
  }

  const data = calculateWorkingCapital()

  return (
    <div>
      <Header title='Capital de Trabajo' subtitle='Evolución del capital de trabajo' />
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
              <WorkingCapitalChart data={data} />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { BalanceChart } from '@/components/charts/BalanceChart'
import { DistributionChart } from '@/components/charts/DistributionChart'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Activity, TrendingUp, Calendar } from 'lucide-react'

export default function Balance8ColumnsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data/8columns')
        if (!res.ok) throw new Error('Error al cargar datos')
        const result = await res.json()
        setData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div>
        <Header title='Balance 8 Columns' subtitle='Datos detallados en 8 columnas' />
        <div className='p-8 flex items-center justify-center'>
          <div className='text-gray-600'>Cargando datos...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Header title='Balance 8 Columns' subtitle='Datos detallados en 8 columnas' />
        <div className='p-8'>
          <Card>
            <div className='text-red-600'>Error: {error}</div>
          </Card>
        </div>
      </div>
    )
  }

  const latestRecord = data?.[0]
  const records = latestRecord?.data || []

  return (
    <div>
      <Header 
        title='Balance 8 Columns' 
        subtitle='Análisis detallado con 8 columnas de datos'
      />
      
      <div className='p-8 space-y-8'>
        {/* Summary Cards */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          <Card>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Registros</p>
                <p className='text-2xl font-bold text-gray-900 mt-1'>{records.length}</p>
              </div>
              <Activity className='h-8 w-8 text-yellow-500' />
            </div>
          </Card>

          <Card>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Fecha de Datos</p>
                <p className='text-2xl font-bold text-gray-900 mt-1'>
                  {latestRecord?.date ? formatDate(new Date(latestRecord.date)) : 'N/A'}
                </p>
              </div>
              <Calendar className='h-8 w-8 text-blue-500' />
            </div>
          </Card>

          <Card>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Última Actualización</p>
                <p className='text-lg font-bold text-gray-900 mt-1'>
                  {latestRecord?.timestamp ? new Date(latestRecord.timestamp).toLocaleString('es-CL') : 'N/A'}
                </p>
              </div>
              <TrendingUp className='h-8 w-8 text-purple-500' />
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <BalanceChart data={records.slice(0, 10)} title='Top 10 Cuentas - Debe vs Haber' />
          <DistributionChart data={records.slice(0, 6)} title='Distribución del Balance (Top 6)' />
        </div>

        {/* Data Table */}
        <Card title='Datos del Balance 8 Columns' subtitle={`Mostrando ${Math.min(20, records.length)} de ${records.length} registros`}>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Código
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Nombre de Cuenta
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Debe
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Haber
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {records.slice(0, 20).map((record: any, index: number) => (
                  <tr key={index} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                      {record.accountCode}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900'>
                      {record.accountName}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900'>
                      {formatCurrency(record.debit)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900'>
                      {formatCurrency(record.credit)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900'>
                      {formatCurrency(record.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
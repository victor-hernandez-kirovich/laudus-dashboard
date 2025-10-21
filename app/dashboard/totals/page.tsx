'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { BalanceChart } from '@/components/charts/BalanceChart'
import { DistributionChart } from '@/components/charts/DistributionChart'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BalanceRecord } from '@/lib/types'

export default function TotalsPage() {
  const [data, setData] = useState<BalanceRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data/totals')
        const result = await res.json()
        if (result.success && result.data.length > 0) {
          setData(result.data[0])
        }
      } catch (error) {
        console.error('Error fetching totals:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div>
        <Header title='Balance Totals' subtitle='Cargando datos...' />
        <div className='flex items-center justify-center h-96'>
          <div className='text-gray-500'>Cargando...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div>
        <Header title='Balance Totals' subtitle='No hay datos disponibles' />
        <div className='flex items-center justify-center h-96'>
          <div className='text-gray-500'>No se encontraron datos</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header 
        title='Balance Totals' 
        subtitle={'Fecha: ' + formatDate(data.date)}
      />
      
      <div className='p-8 space-y-8'>
        {/* Summary Cards */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          <Card title='Total Registros'>
            <p className='text-3xl font-bold text-gray-900'>{data.recordCount}</p>
          </Card>
          <Card title='Fecha de Datos'>
            <p className='text-3xl font-bold text-gray-900'>{formatDate(data.date, 'dd/MM/yyyy')}</p>
          </Card>
          <Card title='Última Actualización'>
            <p className='text-lg font-bold text-gray-900'>
              {new Date(data.insertedAt).toLocaleString('es-CL')}
            </p>
          </Card>
        </div>

        {/* Charts */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <BalanceChart
            data={data.data}
            title='Top 10 Cuentas'
            subtitle='Debe vs Haber'
          />
          <DistributionChart
            data={data.data}
            title='Distribución de Balance'
            subtitle='Top 6 cuentas por balance'
          />
        </div>

        {/* Data Table */}
        <Card title='Detalle de Cuentas' subtitle={'Total: ' + data.recordCount + ' registros'}>
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
                {data.data.slice(0, 20).map((row, index) => (
                  <tr key={index} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                      {row.accountCode}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900'>
                      {row.accountName}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900'>
                      {formatCurrency(row.debit || 0)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900'>
                      {formatCurrency(row.credit || 0)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900'>
                      {formatCurrency(row.balance || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.recordCount > 20 && (
            <div className='mt-4 text-center text-sm text-gray-600'>
              Mostrando 20 de {data.recordCount} registros
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

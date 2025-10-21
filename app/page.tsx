import { Header } from '@/components/layout/Header'
import { StatCard, Card } from '@/components/ui/Card'
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react'
import Link from 'next/link'

async function getHealthStatus() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health`, {
      cache: 'no-store'
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function HomePage() {
  const health = await getHealthStatus()

  return (
    <div>
      <Header 
        title='Dashboard' 
        subtitle='Resumen general de Balance Sheet'
      />
      
      <div className='p-8 space-y-8'>
        {/* Stats Grid */}
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            title='Balance Totals'
            value={health?.collections?.balance_totals?.recordCount || 0}
            subtitle='Registros totales'
            icon={<TrendingUp className='h-6 w-6 text-blue-600' />}
          />
          <StatCard
            title='Balance Standard'
            value={health?.collections?.balance_standard?.recordCount || 0}
            subtitle='Cuentas estándar'
            icon={<Users className='h-6 w-6 text-green-600' />}
          />
          <StatCard
            title='Balance 8 Columns'
            value={health?.collections?.balance_8columns?.recordCount || 0}
            subtitle='Registros detallados'
            icon={<DollarSign className='h-6 w-6 text-yellow-600' />}
          />
          <StatCard
            title='Estado Sistema'
            value={health?.healthy ? 'Activo' : 'Inactivo'}
            subtitle='Última actualización'
            icon={<Activity className='h-6 w-6 text-purple-600' />}
          />
        </div>

        {/* Quick Links */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          <Link href='/dashboard/totals' className='block group'>
            <Card className='group-hover:shadow-md transition-shadow cursor-pointer'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='font-semibold text-gray-900'>Balance Totals</h3>
                  <p className='mt-2 text-sm text-gray-600'>
                    Ver gráficas y detalles de totales
                  </p>
                </div>
                <TrendingUp className='h-8 w-8 text-blue-500' />
              </div>
            </Card>
          </Link>

          <Link href='/dashboard/standard' className='block group'>
            <Card className='group-hover:shadow-md transition-shadow cursor-pointer'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='font-semibold text-gray-900'>Balance Standard</h3>
                  <p className='mt-2 text-sm text-gray-600'>
                    Análisis de cuentas estándar
                  </p>
                </div>
                <Users className='h-8 w-8 text-green-500' />
              </div>
            </Card>
          </Link>

          <Link href='/dashboard/8columns' className='block group'>
            <Card className='group-hover:shadow-md transition-shadow cursor-pointer'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='font-semibold text-gray-900'>Balance 8 Columns</h3>
                  <p className='mt-2 text-sm text-gray-600'>
                    Datos detallados en 8 columnas
                  </p>
                </div>
                <DollarSign className='h-8 w-8 text-yellow-500' />
              </div>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card title='Actividad Reciente' subtitle='Últimas actualizaciones de datos'>
          <div className='space-y-4'>
            {health?.collections && Object.entries(health.collections).map(([name, data]: [string, any]) => (
              <div key={name} className='flex items-center justify-between border-b border-gray-100 pb-3'>
                <div>
                  <p className='font-medium text-gray-900'>{name.replace('balance_', 'Balance ')}</p>
                  <p className='text-sm text-gray-600'>
                    {data.recordCount} registros
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-sm text-gray-600'>
                    {data.lastUpdate ? new Date(data.lastUpdate).toLocaleString('es-CL') : 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
import { Header } from '@/components/layout/Header'
import { StatCard, Card } from '@/components/ui/Card'
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react'
import Link from 'next/link'
import { getDatabase } from '@/lib/mongodb'

async function getHealthStatus() {
  try {
    const db = await getDatabase()
    
    // Obtener datos de las 3 colecciones
    const [totalsDoc, standardDoc, columnsDoc] = await Promise.all([
      db.collection('balance_totals').findOne(),
      db.collection('balance_standard').findOne(),
      db.collection('balance_8columns').findOne()
    ])

    return {
      healthy: true,
      collections: {
        balance_totals: {
          recordCount: totalsDoc?.data?.length || 0,
          lastUpdate: totalsDoc?.insertedAt || null
        },
        balance_standard: {
          recordCount: standardDoc?.data?.length || 0,
          lastUpdate: standardDoc?.insertedAt || null
        },
        balance_8columns: {
          recordCount: columnsDoc?.data?.length || 0,
          lastUpdate: columnsDoc?.insertedAt || null
        }
      }
    }
  } catch (error) {
    console.error('Error fetching MongoDB data:', error)
    return null
  }
}

export default async function HomePage() {
  const health = await getHealthStatus()

  return (
    <div className="min-h-screen">
      <Header
        title='Dashboard'
        subtitle='Resumen general de Balance Sheet'
      />

      <div className='p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8'>
        {/* Stats Grid */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6'>
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
        <div className='grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3'>
          <Link href='/dashboard/totals' className='block group'>
            <Card className='group-hover:shadow-lg group-hover:scale-[1.02] transition-all duration-200 cursor-pointer'>
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
            <Card className='group-hover:shadow-lg group-hover:scale-[1.02] transition-all duration-200 cursor-pointer'>
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
            <Card className='group-hover:shadow-lg group-hover:scale-[1.02] transition-all duration-200 cursor-pointer'>
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

          <Link href='/dashboard/indicadores-financieros' className='block group'>
            <Card className='group-hover:shadow-lg group-hover:scale-[1.02] transition-all duration-200 cursor-pointer'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='font-semibold text-gray-900'>Indicadores Financieros</h3>
                  <p className='mt-2 text-sm text-gray-600'>
                    Ratios e indicadores de liquidez
                  </p>
                </div>
                <TrendingUp className='h-8 w-8 text-purple-500' />
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
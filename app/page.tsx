import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { TrendingUp, Users, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { getDatabase } from '@/lib/mongodb'

async function getHealthStatus() {
  try {
    const db = await getDatabase()
    
    // Obtener datos de las 3 colecciones (último automático y manual de cada una)
    const collections = ['balance_totals', 'balance_standard', 'balance_8columns']
    
    const results = await Promise.all(
      collections.map(async (collectionName) => {
        const collection = db.collection(collectionName)
        
        // Obtener el último documento automático (con loadSource: 'automatic' o sin loadSource para retrocompatibilidad)
        const automaticDocs = await collection
          .find({ $or: [{ loadSource: 'automatic' }, { loadSource: { $exists: false } }] })
          .sort({ insertedAt: -1 })
          .limit(1)
          .toArray()
        
        // Obtener el último documento manual
        const manualDocs = await collection
          .find({ loadSource: 'manual' })
          .sort({ insertedAt: -1 })
          .limit(1)
          .toArray()
        
        return {
          name: collectionName,
          automatic: automaticDocs[0] || null,
          manual: manualDocs[0] || null
        }
      })
    )

    return {
      healthy: true,
      collections: results
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
        {/* (Stats Grid removed as requested) */}

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

          {/* Indicadores Financieros removed as requested */}
        </div>

        {/* Recent Activity */}
        <Card title='Actividad Reciente' subtitle='Últimas actualizaciones de datos'>
          <div className='space-y-6'>
            {/* Carga Automática */}
            <div>
              <div className='flex items-center gap-2 mb-3'>
                <span className='text-2xl'>🤖</span>
                <h3 className='font-semibold text-gray-900'>Carga Automática</h3>
                <span className='px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full'>
                  Diaria
                </span>
              </div>
              <div className='space-y-3 ml-8'>
                {health?.collections && health.collections.map((col: any) => {
                  const doc = col.automatic
                  return (
                    <div key={`auto-${col.name}`} className='flex items-center justify-between border-b border-gray-100 pb-2'>
                      <div>
                        <p className='font-medium text-gray-900'>{col.name.replace('balance_', 'Balance ')}</p>
                        <p className='text-sm text-gray-600'>
                          {doc?.recordCount || 0} registros
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm text-gray-600'>
                          {doc?.insertedAt ? new Date(doc.insertedAt).toLocaleString('es-CL') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Separador */}
            <div className='border-t-2 border-gray-200'></div>

            {/* Carga Manual */}
            <div>
              <div className='flex items-center gap-2 mb-3'>
                <span className='text-2xl'>👤</span>
                <h3 className='font-semibold text-gray-900'>Carga Manual</h3>
                <span className='px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full'>
                  Bajo demanda
                </span>
              </div>
              <div className='space-y-3 ml-8'>
                {health?.collections && health.collections.map((col: any) => {
                  const doc = col.manual
                  return (
                    <div key={`manual-${col.name}`} className='flex items-center justify-between border-b border-gray-100 pb-2'>
                      <div>
                        <p className='font-medium text-gray-900'>{col.name.replace('balance_', 'Balance ')}</p>
                        <p className='text-sm text-gray-600'>
                          {doc?.recordCount || 0} registros
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm text-gray-600'>
                          {doc?.insertedAt ? new Date(doc.insertedAt).toLocaleString('es-CL') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
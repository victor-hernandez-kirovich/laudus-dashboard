'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, Minus } from 'lucide-react'
import { MargenRentabilidadChart } from '@/components/charts/MargenRentabilidadChart'

interface MargenData {
  date: string
  margenNeto: number
  ingresos: number
  gastos: number
  utilidadNeta: number
}

export default function MargenRentabilidadPage() {
  const [allData, setAllData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatSpanishDate = (dateString: string): string => {
    const [year, month, day] = dateString.split('-').map(Number)
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ]
    return `${day} ${months[month - 1]} ${year}`
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data/8columns')
        if (!res.ok) throw new Error('Error al cargar datos')
        const result = await res.json()
        setAllData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Calcular Margen de Rentabilidad Neta para cada fecha
  const calculateMargenRentabilidad = (): MargenData[] => {
    return allData.map(record => {
      const records = record.data || []
      
      // Buscar la fila "Sumas" que contiene los totales
      const filaSumas = records.find((r: any) => r.accountName === "Sumas")
      
      if (!filaSumas) {
        return {
          date: record.date,
          margenNeto: 0,
          ingresos: 0,
          gastos: 0,
          utilidadNeta: 0
        }
      }
      
      const ingresos = filaSumas.incomes || 0
      const gastos = filaSumas.expenses || 0
      const utilidadNeta = ingresos - gastos
      
      // Calcular Margen Neto = (Utilidad Neta / Ingresos) * 100
      const margenNeto = ingresos > 0 ? (utilidadNeta / ingresos) * 100 : 0
      
      return {
        date: record.date,
        margenNeto: margenNeto,
        ingresos: ingresos,
        gastos: gastos,
        utilidadNeta: utilidadNeta
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
  const latestMargen = margenData[0]
  const previousMargen = margenData.length > 1 ? margenData[1] : null
  
  // Calcular cambio vs mes anterior
  const cambioVsMesAnterior = previousMargen 
    ? latestMargen.margenNeto - previousMargen.margenNeto 
    : 0
  
  const tendencia = cambioVsMesAnterior > 0 ? 'up' : cambioVsMesAnterior < 0 ? 'down' : 'neutral'

  // Determinar color del gauge según el margen
  const getMargenColor = (margen: number): string => {
    if (margen >= 20) return '#10b981' // Verde - Excelente
    if (margen >= 10) return '#3b82f6' // Azul - Bueno
    if (margen >= 5) return '#f59e0b' // Amarillo - Regular
    return '#ef4444' // Rojo - Bajo
  }

  const getMargenLabel = (margen: number): string => {
    if (margen >= 20) return 'Excelente'
    if (margen >= 10) return 'Bueno'
    if (margen >= 5) return 'Regular'
    return 'Bajo'
  }

  const margenColor = getMargenColor(latestMargen.margenNeto)
  const margenLabel = getMargenLabel(latestMargen.margenNeto)

  return (
    <div>
      <Header
        title='Margen de Rentabilidad'
        subtitle='Análisis del margen de utilidad neta sobre las ventas'
      />

      <div className='p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8'>
        {/* KPI Card Principal + Gauge */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Margen Neto Actual - Gauge Style */}
          <Card title={`Margen Neto - ${formatSpanishDate(latestMargen.date)}`} className='lg:col-span-1'>
            <div className='flex flex-col items-center justify-center py-8'>
              {/* Gauge circular simulado */}
              <div className='relative w-48 h-48 mb-4'>
                <svg className='w-full h-full transform -rotate-90' viewBox='0 0 100 100'>
                  {/* Fondo del círculo */}
                  <circle
                    cx='50'
                    cy='50'
                    r='40'
                    fill='none'
                    stroke='#e5e7eb'
                    strokeWidth='8'
                  />
                  {/* Progreso del círculo */}
                  <circle
                    cx='50'
                    cy='50'
                    r='40'
                    fill='none'
                    stroke={margenColor}
                    strokeWidth='8'
                    strokeDasharray={`${(latestMargen.margenNeto / 100) * 251.2} 251.2`}
                    strokeLinecap='round'
                  />
                </svg>
                {/* Texto central */}
                <div className='absolute inset-0 flex flex-col items-center justify-center'>
                  <div className='text-5xl font-bold' style={{ color: margenColor }}>
                    {latestMargen.margenNeto.toFixed(1)}%
                  </div>
                  <div className='text-sm font-semibold mt-2' style={{ color: margenColor }}>
                    {margenLabel}
                  </div>
                </div>
              </div>

              {/* Comparación con mes anterior */}
              {previousMargen && (
                <div className='flex items-center gap-2 mt-4'>
                  {tendencia === 'up' && (
                    <>
                      <TrendingUp className='h-5 w-5 text-green-600' />
                      <span className='text-green-600 font-semibold'>
                        +{cambioVsMesAnterior.toFixed(2)}%
                      </span>
                    </>
                  )}
                  {tendencia === 'down' && (
                    <>
                      <TrendingDown className='h-5 w-5 text-red-600' />
                      <span className='text-red-600 font-semibold'>
                        {cambioVsMesAnterior.toFixed(2)}%
                      </span>
                    </>
                  )}
                  {tendencia === 'neutral' && (
                    <>
                      <Minus className='h-5 w-5 text-gray-600' />
                      <span className='text-gray-600 font-semibold'>
                        Sin cambio
                      </span>
                    </>
                  )}
                  <span className='text-sm text-gray-600'>vs mes anterior</span>
                </div>
              )}
            </div>
          </Card>

          {/* Desglose Financiero */}
          <Card title='Desglose del Mes Actual' className='lg:col-span-2'>
            <div className='space-y-6 py-4'>
              {/* Ingresos */}
              <div className='flex items-center justify-between pb-4 border-b border-gray-200'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                    <DollarSign className='h-6 w-6 text-green-600' />
                  </div>
                  <div>
                    <div className='text-sm text-gray-600'>Ingresos Totales</div>
                    <div className='text-2xl font-bold text-green-600'>
                      {formatCurrency(latestMargen.ingresos)}
                    </div>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-sm text-gray-600'>100%</div>
                  <div className='text-xs text-gray-500'>del total</div>
                </div>
              </div>

              {/* Gastos */}
              <div className='flex items-center justify-between pb-4 border-b border-gray-200'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center'>
                    <TrendingDown className='h-6 w-6 text-red-600' />
                  </div>
                  <div>
                    <div className='text-sm text-gray-600'>Gastos Totales</div>
                    <div className='text-2xl font-bold text-red-600'>
                      {formatCurrency(latestMargen.gastos)}
                    </div>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-sm text-gray-600'>
                    {((latestMargen.gastos / latestMargen.ingresos) * 100).toFixed(1)}%
                  </div>
                  <div className='text-xs text-gray-500'>del total</div>
                </div>
              </div>

              {/* Utilidad Neta */}
              <div className='flex items-center justify-between pt-2'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                    <TrendingUp className='h-6 w-6 text-blue-600' />
                  </div>
                  <div>
                    <div className='text-sm text-gray-600 font-semibold'>Utilidad Neta</div>
                    <div className='text-3xl font-bold text-blue-600'>
                      {formatCurrency(latestMargen.utilidadNeta)}
                    </div>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-lg font-bold' style={{ color: margenColor }}>
                    {latestMargen.margenNeto.toFixed(2)}%
                  </div>
                  <div className='text-xs text-gray-500'>margen neto</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Gráfico de Evolución */}
        {margenData.length > 1 && (
          <MargenRentabilidadChart data={margenData.slice(0, 12)} />
        )}

        {/* Interpretación */}
        <Card title='¿Qué es el Margen de Rentabilidad Neta?'>
          <div className='text-sm text-gray-700 space-y-4'>
            <p>
              El <strong>Margen de Rentabilidad Neta</strong> (o Margen Neto) es un indicador financiero que muestra 
              qué porcentaje de las ventas se convierte finalmente en ganancia después de descontar todos los gastos.
            </p>
            
            <div className='bg-blue-50 border-l-4 border-blue-500 p-4 my-4'>
              <p className='font-semibold text-blue-900 mb-2'>Fórmula:</p>
              <p className='text-blue-800 font-mono text-sm'>
                Margen Neto = (Utilidad Neta / Ingresos Totales) × 100
              </p>
              <p className='text-blue-800 font-mono text-sm mt-1'>
                Utilidad Neta = Ingresos - Gastos
              </p>
            </div>

            <div>
              <p className='font-semibold mb-2'>Interpretación:</p>
              <ul className='space-y-2 pl-4'>
                <li className='flex items-start gap-2'>
                  <span className='text-green-600 font-bold'>•</span>
                  <span>
                    <strong className='text-green-600'>≥ 20%:</strong> Excelente rentabilidad. 
                    La empresa es muy eficiente convirtiendo ventas en ganancias.
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-blue-600 font-bold'>•</span>
                  <span>
                    <strong className='text-blue-600'>10-20%:</strong> Buena rentabilidad. 
                    Margen saludable para la mayoría de las industrias.
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-orange-600 font-bold'>•</span>
                  <span>
                    <strong className='text-orange-600'>5-10%:</strong> Rentabilidad regular. 
                    Hay espacio para mejorar la eficiencia operativa.
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-red-600 font-bold'>•</span>
                  <span>
                    <strong className='text-red-600'>&lt; 5%:</strong> Rentabilidad baja. 
                    Se requiere revisar costos y estrategia de precios.
                  </span>
                </li>
              </ul>
            </div>

            <div className='bg-gray-50 p-4 rounded-lg mt-4'>
              <p className='font-semibold mb-2'>Ejemplo práctico:</p>
              <p>
                Si tu empresa vende <strong>$1,000,000</strong> y al final del período tiene 
                una utilidad neta de <strong>$150,000</strong>:
              </p>
              <p className='mt-2 font-mono text-sm bg-white p-2 rounded'>
                Margen Neto = (150,000 / 1,000,000) × 100 = <strong className='text-blue-600'>15%</strong>
              </p>
              <p className='mt-2'>
                Esto significa que por cada <strong>$100 vendidos</strong>, la empresa gana <strong>$15</strong> de utilidad neta.
              </p>
            </div>

            <div className='mt-4'>
              <p className='font-semibold mb-2'>Tu margen actual ({latestMargen.margenNeto.toFixed(2)}%):</p>
              <p>
                Por cada <strong>$100 en ventas</strong>, tu empresa está generando{' '}
                <strong style={{ color: margenColor }}>
                  ${latestMargen.margenNeto.toFixed(2)} de utilidad neta
                </strong>.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

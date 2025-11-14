'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { EstructuraFinancieraChart } from '@/components/charts/EstructuraFinancieraChart'

export default function EstructuraFinancieraPage() {
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

  const calculateEstructuraFinanciera = () => {
    if (!allData || allData.length === 0) return []
    
    console.log('=== TABLA DE ACTIVOS Y PASIVOS POR FECHA ===')
    
    // Crear tabla con todos los registros
    const tablaResumen = allData.map((record: any) => {
      const records = record.data || []
      
      // Buscar cuenta 1 (ACTIVO)
      const cuentaActivo = records.find((r: any) => r.accountNumber === "1")
      // Buscar cuenta 2 (PASIVO)
      const cuentaPasivo = records.find((r: any) => r.accountNumber === "2")
      
      const activos = cuentaActivo?.assets || 0
      const pasivos = cuentaPasivo?.liabilities || 0
      const patrimonio = activos - pasivos
      const endeudamiento = activos > 0 ? ((pasivos / activos) * 100).toFixed(2) : 0
      const autonomia = activos > 0 ? ((patrimonio / activos) * 100).toFixed(2) : 0
      
      return {
        Fecha: record.date,
        'Activos (columna)': activos.toLocaleString('es-CL'),
        'Pasivos (columna)': pasivos.toLocaleString('es-CL'),
        'Patrimonio (calc)': patrimonio.toLocaleString('es-CL'),
        'Endeudamiento %': endeudamiento,
        'Autonomía %': autonomia,
        'Suma %': (parseFloat(endeudamiento.toString()) + parseFloat(autonomia.toString())).toFixed(2)
      }
    })
    
    console.table(tablaResumen)
    
    return allData.map((record: any, index: number) => {
      const records = record.data || []
      
      // La estructura contable básica es: Activo = Pasivo + Patrimonio
      // Debemos buscar la fila "Sumas" que contiene los totales correctos
      
      // Buscar la fila "Sumas" (accountName === "Sumas")
      const filaSumas = records.find((r: any) => r.accountName === "Sumas")
      
      if (!filaSumas) {
        console.warn('No se encontró la fila "Sumas" para la fecha:', record.date)
        return {
          date: record.date,
          endeudamiento: 0,
          autonomia: 0,
          activoTotal: 0,
          pasivoTotal: 0,
          patrimonio: 0
        }
      }
      
      const activoTotal = filaSumas.assets || 0
      const pasivoTotal = filaSumas.liabilities || 0
      
      // DEBUG: Ver TODOS los campos de la fila "Sumas"
      if (index === 0) {
        console.log('=== FILA "SUMAS" ===')
        console.log('Todos los campos:', filaSumas)
        
        console.log('=== RESUMEN COLUMNAS ===')
        console.log('FILA SUMAS:')
        console.log('  - debit:', filaSumas?.debit)
        console.log('  - credit:', filaSumas?.credit)
        console.log('  - debtorBalance:', filaSumas?.debtorBalance)
        console.log('  - creditorBalance:', filaSumas?.creditorBalance)
        console.log('  - assets:', filaSumas?.assets)
        console.log('  - liabilities:', filaSumas?.liabilities)
      }
      
      // Calcular Patrimonio = Activo Total - Pasivo Total
      const patrimonio = activoTotal - pasivoTotal
      
      if (index === 0) {
        console.log('Valores finales:', { activoTotal, pasivoTotal, patrimonio })
        console.log('Suma Pasivo + Patrimonio:', pasivoTotal + patrimonio)
        console.log('¿Cuadra?', (pasivoTotal + patrimonio) === activoTotal)
      }
      
      // Calcular porcentajes
      const endeudamiento = activoTotal > 0 ? (pasivoTotal / activoTotal) * 100 : 0
      const autonomia = activoTotal > 0 ? (patrimonio / activoTotal) * 100 : 0
      
      return { 
        date: record.date, 
        endeudamiento,
        autonomia,
        activoTotal,
        pasivoTotal,
        patrimonio
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

  const allEstructura = calculateEstructuraFinanciera()
  const data = filterMonthlyData(allEstructura)
  const latest = data[0]

  return (
    <div>
      <Header title='Estructura Financiera' subtitle='Composición del financiamiento' />
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
              {/* Valores actuales */}
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
                {/* <Card title="Endeudamientorrrrrr">
                  <div className='text-center py-4'>
                    <div className='text-4xl font-bold text-red-600'>
                      {latest?.endeudamiento.toFixed(2)}%
                    </div>
                    <div className='mt-2 text-sm text-gray-600'>
                      Financiado con deuda
                    </div>
                    <div className='mt-4 text-xs text-gray-500'>
                      {formatCurrency(latest?.pasivoTotal)}
                    </div>
                  </div>
                </Card> */}

                {/* <Card title="Autonomía Financieraaaaaaa">
                  <div className='text-center py-4'>
                    <div className='text-4xl font-bold text-green-600'>
                      {latest?.autonomia.toFixed(2)}%
                    </div>
                    <div className='mt-2 text-sm text-gray-600'>
                      Financiado con capital propio
                    </div>
                    <div className='mt-4 text-xs text-gray-500'>
                      {formatCurrency(latest?.patrimonio)}
                    </div>
                  </div>
                </Card> */}

                {/* <Card title="Activo Total">
                  <div className='text-center py-4'>
                    <div className='text-4xl font-bold text-blue-600'>
                      {formatCurrency(latest?.activoTotal)}
                    </div>
                    <div className='mt-2 text-sm text-gray-600'>
                      Total de activos
                    </div>
                    <div className='mt-4 text-xs text-gray-500'>
                      {new Date(latest?.date).toLocaleDateString('es-CL')}
                    </div>
                  </div>
                </Card> */}
              </div>

              {/* Gráfico */}
              <EstructuraFinancieraChart data={data} />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

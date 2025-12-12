'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import RatioCirculantePage from './dashboard/indicadores-financieros/ratio-circulante/page'
import CapitalTrabajoPage from './dashboard/indicadores-financieros/capital-trabajo/page'
import EstructuraFinancieraPage from './dashboard/indicadores-financieros/estructura-financiera/page'
import MargenRentabilidadPage from './dashboard/indicadores-financieros/margen-rentabilidad/page'
import EbitdaPage from './dashboard/indicadores-financieros/ebitda/page'
import RoaPage from './dashboard/indicadores-financieros/roa/page'
import RoiPage from './dashboard/indicadores-financieros/roi/page'

type IndicatorTab = 'ratio-liquidez' | 'capital-trabajo' | 'estructura-financiera' | 'margen-rentabilidad' | 'ebitda' | 'roa' | 'roi'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<IndicatorTab>('ratio-liquidez')

  const tabs = [
    { id: 'ratio-liquidez' as const, label: 'Ratio Liquidez' },
    { id: 'capital-trabajo' as const, label: 'Capital Trabajo' },
    { id: 'estructura-financiera' as const, label: 'Estructura Financiera' },
    { id: 'margen-rentabilidad' as const, label: 'Margen Rentabilidad' },
    { id: 'ebitda' as const, label: 'EBITDA' },
    { id: 'roa' as const, label: 'ROA' },
    { id: 'roi' as const, label: 'ROI' },
  ]

  const renderIndicatorContent = () => {
    switch (activeTab) {
      case 'ratio-liquidez':
        return <RatioCirculantePage />
      case 'capital-trabajo':
        return <CapitalTrabajoPage />
      case 'estructura-financiera':
        return <EstructuraFinancieraPage />
      case 'margen-rentabilidad':
        return <MargenRentabilidadPage />
      case 'ebitda':
        return <EbitdaPage />
      case 'roa':
        return <RoaPage />
      case 'roi':
        return <RoiPage />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen">
      <Header
        title='Dashboard Financiero'
        subtitle='Indicadores Clave de Rendimiento (KPIs)'
      />

      <div className='p-4 sm:p-6 lg:p-8'>
        {/* Tabs */}
        <div className='mb-6 border-b border-gray-200'>
          <nav className='flex flex-wrap gap-2 -mb-px'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div>
          {renderIndicatorContent()}
        </div>
      </div>
    </div>
  )
}
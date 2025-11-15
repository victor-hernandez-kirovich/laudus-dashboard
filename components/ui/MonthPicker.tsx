'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthPickerProps {
  availableDates: string[] // Format: 'YYYY-MM-DD' (last day of each month)
  selectedDate: string
  onDateSelect: (date: string) => void
}

export function MonthPicker({ availableDates, selectedDate, onDateSelect }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const dropdownRef = useRef<HTMLDivElement>(null)

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const monthNamesShort = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ]

  // Formatear fecha seleccionada para mostrar: "Mes Año"
  const formatSelectedMonth = (dateString: string): string => {
    const [year, month] = dateString.split('-')
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Crear un mapa de meses disponibles: "YYYY-MM" -> "YYYY-MM-DD"
  const availableMonthsMap = new Map<string, string>()
  availableDates.forEach(date => {
    const [year, month] = date.split('-')
    const monthKey = `${year}-${month}`
    availableMonthsMap.set(monthKey, date)
  })

  // Obtener años disponibles
  const availableYears = Array.from(new Set(
    Array.from(availableMonthsMap.keys()).map(key => parseInt(key.split('-')[0]))
  )).sort((a, b) => b - a) // Ordenar descendente

  // Inicializar con el año de la fecha seleccionada
  useEffect(() => {
    if (selectedDate) {
      const [year] = selectedDate.split('-')
      setCurrentYear(parseInt(year))
    }
  }, [selectedDate])

  const handlePrevYear = () => {
    setCurrentYear(prev => prev - 1)
  }

  const handleNextYear = () => {
    setCurrentYear(prev => prev + 1)
  }

  const handleMonthClick = (monthIndex: number) => {
    const monthKey = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}`
    const fullDate = availableMonthsMap.get(monthKey)
    
    if (fullDate) {
      onDateSelect(fullDate)
      setIsOpen(false)
    }
  }

  const isMonthAvailable = (monthIndex: number): boolean => {
    const monthKey = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}`
    return availableMonthsMap.has(monthKey)
  }

  const isMonthSelected = (monthIndex: number): boolean => {
    if (!selectedDate) return false
    const [year, month] = selectedDate.split('-')
    return parseInt(year) === currentYear && parseInt(month) === monthIndex + 1
  }

  // Verificar si el año actual tiene meses disponibles
  const hasMonthsInYear = Array.from({ length: 12 }, (_, i) => i).some(isMonthAvailable)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón selector */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 text-sm font-medium shadow-sm hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-between gap-3 min-w-[200px]"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span>{formatSelectedMonth(selectedDate)}</span>
        </div>
        <ChevronRight 
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} 
        />
      </button>

      {/* Dropdown con selector de meses */}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-[320px] left-0 sm:left-auto sm:right-0">
          {/* Header con selector de año */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevYear}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              type="button"
              disabled={!availableYears.includes(currentYear - 1)}
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h3 className="text-sm font-semibold text-gray-900">
              {currentYear}
            </h3>
            <button
              onClick={handleNextYear}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              type="button"
              disabled={!availableYears.includes(currentYear + 1)}
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Grid de meses */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {monthNamesShort.map((month, index) => {
              const available = isMonthAvailable(index)
              const selected = isMonthSelected(index)

              return (
                <button
                  key={index}
                  onClick={() => handleMonthClick(index)}
                  disabled={!available}
                  type="button"
                  className={`
                    px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${!available ? 'text-gray-300 cursor-not-allowed bg-gray-50' : ''}
                    ${available && !selected ? 'text-gray-900 hover:bg-blue-50 hover:text-blue-600 bg-white border border-gray-200' : ''}
                    ${selected ? 'bg-blue-600 text-white font-bold shadow-md' : ''}
                  `}
                >
                  {month}
                </button>
              )
            })}
          </div>

          {/* Mensaje si no hay meses disponibles en el año actual */}
          {!hasMonthsInYear && (
            <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 rounded-lg">
              No hay datos disponibles para {currentYear}
            </div>
          )}

          {/* Footer con información */}
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {availableDates.length} {availableDates.length === 1 ? 'mes disponible' : 'meses disponibles'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

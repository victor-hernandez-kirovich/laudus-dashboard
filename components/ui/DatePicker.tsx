'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface DatePickerProps {
  availableDates: string[] // Format: 'YYYY-MM-DD'
  selectedDate: string
  onDateSelect: (date: string) => void
}

export function DatePicker({ availableDates, selectedDate, onDateSelect }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const dropdownRef = useRef<HTMLDivElement>(null)

  const formatSpanishDate = (dateString: string): string => {
    const [year, month, day] = dateString.split('-')
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
  }

  const formatShortSpanishDate = (dateString: string): string => {
    const [year, month, day] = dateString.split('-')
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ]
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
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

  // Crear Set de fechas disponibles para búsqueda rápida
  const availableDatesSet = new Set(availableDates)

  // Obtener primer y último día del mes actual
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Calcular días del calendario (incluyendo días del mes anterior/siguiente)
  const startDay = firstDay.getDay() // 0 = Domingo, 1 = Lunes, etc.
  const daysInMonth = lastDay.getDate()
  
  // Generar array de días para el calendario
  const calendarDays: (Date | null)[] = []
  
  // Días del mes anterior
  for (let i = 0; i < startDay; i++) {
    const prevMonthDay = new Date(year, month, -startDay + i + 1)
    calendarDays.push(prevMonthDay)
  }
  
  // Días del mes actual
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(year, month, i))
  }
  
  // Días del mes siguiente para completar la última semana
  const remainingDays = 7 - (calendarDays.length % 7)
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push(new Date(year, month + 1, i))
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    if (availableDatesSet.has(dateStr)) {
      onDateSelect(dateStr)
      setIsOpen(false)
    }
  }

  const isDateAvailable = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0]
    return availableDatesSet.has(dateStr)
  }

  const isDateSelected = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0]
    return dateStr === selectedDate
  }

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === month
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón selector */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 text-sm font-medium shadow-sm hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-between gap-3 min-w-[240px]"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span>{formatShortSpanishDate(selectedDate)}</span>
        </div>
        <ChevronRight 
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} 
        />
      </button>

      {/* Dropdown con calendario */}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-[320px] left-0 sm:left-auto sm:right-0">
          {/* Header del calendario */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h3 className="text-sm font-semibold text-gray-900">
              {monthNames[month]} {year}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, idx) => (
              <div
                key={idx}
                className="text-center text-xs font-medium text-gray-500 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid de días */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, idx) => {
              if (!date) return <div key={idx} />

              const available = isDateAvailable(date)
              const selected = isDateSelected(date)
              const currentMonthDay = isCurrentMonth(date)

              return (
                <button
                  key={idx}
                  onClick={() => handleDateClick(date)}
                  disabled={!available}
                  type="button"
                  className={`
                    h-9 w-9 rounded-lg text-sm font-medium transition-all
                    ${!currentMonthDay ? 'text-gray-300' : ''}
                    ${!available && currentMonthDay ? 'text-gray-400 cursor-not-allowed' : ''}
                    ${available && !selected && currentMonthDay ? 'text-gray-900 hover:bg-blue-50 hover:text-blue-600' : ''}
                    ${selected ? 'bg-blue-600 text-white font-bold shadow-md' : ''}
                    ${available && currentMonthDay ? 'cursor-pointer' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          {/* Footer con información */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {availableDates.length} fechas disponibles
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

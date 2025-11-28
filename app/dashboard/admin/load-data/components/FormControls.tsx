import { Calendar, Database, Download, CheckCircle, XCircle, Clock } from 'lucide-react'
import { EndpointStatus } from '../hooks/useLoadDataState'

interface EndpointSelectorProps {
  endpoints: EndpointStatus[]
  onToggle: (name: string) => void
  isLoading: boolean
}

const getStatusIcon = (status: EndpointStatus['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className='h-5 w-5 text-gray-400' />
    case 'loading':
      return <Download className='h-5 w-5 text-blue-500 animate-pulse' />
    case 'success':
      return <CheckCircle className='h-5 w-5 text-green-500' />
    case 'error':
      return <XCircle className='h-5 w-5 text-red-500' />
  }
}

const getStatusText = (endpoint: EndpointStatus) => {
  switch (endpoint.status) {
    case 'pending':
      return 'Pendiente'
    case 'loading':
      return 'Cargando...'
    case 'success':
      return `✓ ${endpoint.records} registros`
    case 'error':
      return `✗ ${endpoint.error || 'Error'}`
  }
}

export function EndpointSelector({ endpoints, onToggle, isLoading }: EndpointSelectorProps) {
  return (
    <div>
      <label className='flex items-center gap-2 text-sm font-medium text-gray-700 mb-3'>
        <Database className='h-4 w-4 text-blue-600' />
        Endpoints a Cargar
      </label>
      <div className='space-y-2'>
        {endpoints.map(endpoint => (
          <div
            key={endpoint.name}
            className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
          >
            <div className='flex items-center gap-3'>
              <input
                type='checkbox'
                id={endpoint.name}
                checked={endpoint.enabled}
                onChange={() => onToggle(endpoint.name)}
                disabled={isLoading}
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed'
              />
              <label
                htmlFor={endpoint.name}
                className='text-sm font-medium text-gray-900 cursor-pointer'
              >
                {endpoint.label}
              </label>
            </div>
            <div className='flex items-center gap-2'>
              {getStatusIcon(endpoint.status)}
              <span className='text-xs text-gray-600'>
                {getStatusText(endpoint)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface DateSelectorProps {
  selectedDate: string
  onChange: (date: string) => void
  isLoading: boolean
}

export function DateSelector({ selectedDate, onChange, isLoading }: DateSelectorProps) {
  return (
    <div>
      <label className='flex items-center gap-2 text-sm font-medium text-gray-700 mb-2'>
        <Calendar className='h-4 w-4 text-blue-600' />
        Fecha del Balance
      </label>
      <input
        type='date'
        value={selectedDate}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        max={new Date().toISOString().split('T')[0]}
        className='w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed'
      />
      <p className='mt-1 text-xs text-gray-500'>
        Selecciona la fecha para la cual deseas cargar los datos
      </p>
    </div>
  )
}

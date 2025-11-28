import { EndpointStatus } from '../hooks/useLoadDataState'

export function validateDate(date: string): { valid: boolean; error?: string } {
  const targetDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (targetDate > today) {
    return { valid: false, error: 'No se pueden cargar datos de fechas futuras' }
  }

  return { valid: true }
}

export function validateEndpoints(endpoints: EndpointStatus[]): { valid: boolean; error?: string; enabledEndpoints?: EndpointStatus[] } {
  const enabledEndpoints = endpoints.filter(e => e.enabled)
  
  if (enabledEndpoints.length === 0) {
    return { valid: false, error: 'Debes seleccionar al menos un endpoint' }
  }

  return { valid: true, enabledEndpoints }
}

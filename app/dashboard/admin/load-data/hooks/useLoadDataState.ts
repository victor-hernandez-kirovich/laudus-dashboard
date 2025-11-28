import { useState, useEffect } from 'react'

export interface EndpointStatus {
  name: string
  label: string
  enabled: boolean
  status: 'pending' | 'loading' | 'success' | 'error'
  records?: number
  error?: string
}

interface PersistedState {
  selectedDate: string
  endpoints: EndpointStatus[]
  activeJobId?: string
  logs: string[]
  lastUpdated: string
}

const STORAGE_KEY = 'laudus-load-data-state'

// Función para cargar estado desde localStorage
const loadPersistedState = (): Partial<PersistedState> | null => {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const parsed: PersistedState = JSON.parse(stored)

    // Validar que no sea muy antiguo (más de 7 días)
    const lastUpdated = new Date(parsed.lastUpdated)
    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceUpdate > 7) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsed
  } catch (error) {
    console.error('Error loading persisted state:', error)
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

// Función para guardar estado en localStorage
const savePersistedState = (state: PersistedState) => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving persisted state:', error)
  }
}

const getDefaultDate = () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
}

const getDefaultEndpoints = (): EndpointStatus[] => [
  { name: '8Columns', label: 'Balance 8 Columns', enabled: true, status: 'pending' }
]

export function useLoadDataState() {
  const [isMounted, setIsMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(getDefaultDate())
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>(getDefaultEndpoints())
  const [logs, setLogs] = useState<string[]>([])
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  // Cargar estado persistido al montar
  useEffect(() => {
    setIsMounted(true)
    const persisted = loadPersistedState()

    if (persisted) {
      if (persisted.selectedDate) {
        setSelectedDate(persisted.selectedDate)
      }
      if (persisted.endpoints) {
        // Filtrar solo el endpoint válido (8Columns) para migrar de versiones antiguas
        const validEndpoints = persisted.endpoints.filter(
          (ep: EndpointStatus) => ep.name === '8Columns'
        )
        if (validEndpoints.length > 0) {
          setEndpoints(validEndpoints)
        }
      }
      if (persisted.logs && persisted.logs.length > 0) {
        setLogs(persisted.logs)
      }
      if (persisted.activeJobId) {
        setActiveJobId(persisted.activeJobId)
      }
    }
  }, [])

  // Persistir estado cuando cambia
  useEffect(() => {
    if (!isMounted) return

    const state: PersistedState = {
      selectedDate,
      endpoints,
      activeJobId: activeJobId || undefined,
      logs,
      lastUpdated: new Date().toISOString()
    }
    savePersistedState(state)
  }, [selectedDate, endpoints, activeJobId, logs, isMounted])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('es-CL')
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const clearState = () => {
    localStorage.removeItem(STORAGE_KEY)
    setSelectedDate(getDefaultDate())
    setEndpoints(getDefaultEndpoints())
    setLogs(['🔄 Estado reiniciado a valores por defecto'])
    setActiveJobId(null)
  }

  const resetEndpointStatuses = () => {
    setEndpoints(prev =>
      prev.map(e => ({ ...e, status: 'pending' as const, records: undefined, error: undefined }))
    )
  }

  const toggleEndpoint = (name: string) => {
    setEndpoints(prev =>
      prev.map(e => e.name === name ? { ...e, enabled: !e.enabled } : e)
    )
  }

  return {
    isMounted,
    selectedDate,
    setSelectedDate,
    endpoints,
    setEndpoints,
    logs,
    setLogs,
    addLog,
    activeJobId,
    setActiveJobId,
    clearState,
    resetEndpointStatuses,
    toggleEndpoint,
    getPersistedState: loadPersistedState
  }
}

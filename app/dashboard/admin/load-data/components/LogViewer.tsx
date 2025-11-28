import { CheckCircle } from 'lucide-react'

interface LogViewerProps {
  logs: string[]
  isLoading: boolean
  isPolling: boolean
  isMounted: boolean
  activeJobId: string | null
}

export function LogViewer({ logs, isLoading, isPolling, isMounted, activeJobId }: LogViewerProps) {
  if (!isMounted || (!logs.length && !isLoading && !isPolling && !activeJobId)) {
    return null
  }

  return (
    <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs sm:text-sm overflow-x-auto max-h-96 overflow-y-auto'>
      {logs.length > 0 ? (
        logs.map((log, index) => (
          <div key={index} className='mb-1'>
            {log}
          </div>
        ))
      ) : (
        <div className='text-gray-400 flex items-center gap-2'>
          <div className='h-2 w-2 bg-blue-500 rounded-full animate-pulse'></div>
          <span>Iniciando proceso...</span>
        </div>
      )}
    </div>
  )
}

interface LoadingIndicatorProps {
  isPolling: boolean
}

export function LoadingIndicator({ isPolling }: LoadingIndicatorProps) {
  if (!isPolling) return null

  return (
    <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
      <div className='flex items-center gap-2 text-sm text-blue-700'>
        <div className='h-2 w-2 bg-blue-500 rounded-full animate-pulse'></div>
        <span>Monitoreando progreso del workflow en GitHub Actions...</span>
      </div>
    </div>
  )
}

interface StateIndicatorProps {
  getPersistedState: () => any
  isMounted: boolean
}

export function StateIndicator({ getPersistedState, isMounted }: StateIndicatorProps) {
  if (!isMounted) return null

  const persisted = getPersistedState()
  if (!persisted?.lastUpdated) return null

  const lastUpdated = new Date(persisted.lastUpdated)
  const timeAgo = (() => {
    const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
    if (seconds < 60) return 'hace unos segundos'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`
    const days = Math.floor(hours / 24)
    return `hace ${days} día${days > 1 ? 's' : ''}`
  })()

  return (
    <div className='pt-4 border-t border-gray-200'>
      <div className='flex items-center gap-2 text-xs text-gray-500'>
        <CheckCircle className='h-4 w-4 text-green-500' />
        <span>Estado guardado automáticamente {timeAgo}</span>
      </div>
    </div>
  )
}

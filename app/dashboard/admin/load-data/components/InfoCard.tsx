import { AlertCircle } from 'lucide-react'

export function InfoCard() {
  return (
    <div className='space-y-4'>
      <div className='flex items-start gap-3 text-sm text-gray-600'>
        <AlertCircle className='h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5' />
        <div className='space-y-2'>
          <p>
            <strong>Nota:</strong> Esta herramienta permite cargar datos históricos desde la API de Laudus ERP.
          </p>
          <ul className='list-disc list-inside space-y-1 ml-2'>
            <li>Los datos se guardan en la misma estructura que la automatización diaria</li>
            <li>Si ya existen datos para la fecha seleccionada, serán sobrescritos</li>
            <li>El proceso se ejecuta en segundo plano (local o GitHub Actions)</li>
            <li>El sistema monitorea automáticamente el progreso cada 15 segundos</li>
            <li>Puedes navegar a otras secciones mientras se ejecuta el proceso</li>
            <li>Solo se pueden cargar fechas pasadas o la fecha actual</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

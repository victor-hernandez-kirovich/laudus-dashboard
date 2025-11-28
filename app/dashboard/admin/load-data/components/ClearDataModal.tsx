import { AlertCircle } from 'lucide-react'

interface ClearDataModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ClearDataModal({ isOpen, onClose, onConfirm }: ClearDataModalProps) {
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4'>
        <div className='flex items-start gap-3'>
          <AlertCircle className='h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5' />
          <div className='flex-1'>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              ¿Estás seguro de que deseas limpiar todos los datos guardados?
            </h3>
            <p className='text-sm text-gray-600'>
              Esto reiniciará la configuración a los valores por defecto.
            </p>
          </div>
        </div>

        <div className='flex justify-end gap-3 pt-4'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors'
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

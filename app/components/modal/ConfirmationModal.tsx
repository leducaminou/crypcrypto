'use client'

import { useEffect, useState } from 'react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message?: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  confirmColor?: 'green' | 'red' | 'blue' | 'gray'
  processing?: boolean
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  confirmColor = 'blue',
  processing = false
}: ConfirmationModalProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getConfirmButtonClass = () => {
    switch (confirmColor) {
      case 'green':
        return 'bg-green-600 hover:bg-green-500 focus:ring-green-500'
      case 'red':
        return 'bg-red-600 hover:bg-red-500 focus:ring-red-500'
      case 'blue':
        return 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-500'
      case 'gray':
        return 'bg-gray-600 hover:bg-gray-500 focus:ring-gray-500'
      default:
        return 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-500'
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Ne pas rendre le modal pendant le SSR
  if (!isMounted || !isOpen) {
    return null
  }

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-700">
          <div className="bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 sm:mx-0 sm:h-10 sm:w-10">
                <svg 
                  className="h-6 w-6 text-cyan-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth="1.5" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" 
                  />
                </svg>
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-white">
                  {title}
                </h3>
                {
                  message && 
                <div className="mt-2">
                  <div className="text-sm text-gray-300">
                    {message}
                  </div>
                </div>
                }
              </div>
            </div>
          </div>
          <div className="bg-gray-800 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-700">
            <button
              type="button"
              disabled={processing}
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 sm:ml-3 sm:w-auto ${getConfirmButtonClass()} disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={onConfirm}
            >
              {processing ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Traitement...
                </div>
              ) : (
                confirmText
              )}
            </button>
            <button
              type="button"
              disabled={processing}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onClose}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
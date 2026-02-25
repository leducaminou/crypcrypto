'use client'

import { toast } from 'react-toastify'
import { useCallback } from 'react'

export const useToast = () => {
  // Memoïser chaque fonction pour éviter recréations à chaque render du parent
  // (brise les potentiels re-renders en cascade avec Fast Refresh)
  const showSuccess = useCallback((message: string) => {

    toast.success(message)
  }, [])

  const showError = useCallback((message: string) => {
    
    toast.error(message)
  }, [])

  const showInfo = useCallback((message: string) => {
    toast.info(message)
  }, [])

  const showWarning = useCallback((message: string) => {
    toast.warning(message)
  }, [])

  return { showSuccess, showError, showInfo, showWarning }
}
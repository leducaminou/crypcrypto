import React from 'react'

const SectionLoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center h-screen w-full">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-300">Chargement en cours...</p>
      </div>
    </div>
  )
}

export default SectionLoadingSpinner
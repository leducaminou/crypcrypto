import React from 'react'
interface Props {
    error: string | null
}

const SectionError = ({error}: Props) => {
  return (
     <div className="flex flex-col gap-0 text-white mt-28">
        <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-xl p-6 mb-8">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <div>
              <h3 className="font-semibold text-red-300">Erreur de chargement</h3>
              <p className="text-red-400 text-sm mt-1">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-3 bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
   
      </div>
  )
}

export default SectionError
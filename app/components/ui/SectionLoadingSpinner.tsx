import React from 'react'

const SectionLoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-cyan-400"></div>
    </div>
  )
}

export default SectionLoadingSpinner
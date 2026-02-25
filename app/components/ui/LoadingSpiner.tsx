import React from 'react'



const LoadingSpiner = ({size, position, title}: {size?:string , position?: string, title?: string}) => {

  const spinSize = size === 'sm' 
  ? 'w-5 h-5' 
  : size === 'md' 
  ? 'w-6 h-6' 
  : size === 'lg' 
  ? 'w-7 h-7' 
  : size === 'xs' 
  ? 'w-4 h-4' 
  : 'w-8 h-8'


  const spinPosition = position === 'center' 
  ? 'justify-center'
  : position === 'right' 
  ? 'justify-start' : ''
  
  return (
    <div className={`flex ${spinPosition}`}>
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
  )
}

export default LoadingSpiner
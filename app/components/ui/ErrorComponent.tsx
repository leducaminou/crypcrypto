import React from 'react'


interface ErrorProps {
    error?: string;
}

const ErrorComponent = ({
    error
}:ErrorProps) => {
  return (
    <div className="text-center py-12 text-red-400">{error ? error : "Il y a eu une erreur !"}</div>
  )
}

export default ErrorComponent
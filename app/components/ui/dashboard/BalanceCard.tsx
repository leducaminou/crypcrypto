import React from 'react'


interface BalanceCardProps {
    balance: string;
    
    title: string;
    description: string;

}


const BalanceCard = ({
    
    balance,
    
    title,
    description,
}:BalanceCardProps) => {
  return (
    <div className="w-full bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <p className="text-3xl font-bold text-cyan-400">{balance}$</p>
        <p className="text-sm text-gray-400 mt-2">{description}</p>
      </div>
  )
}

export default BalanceCard
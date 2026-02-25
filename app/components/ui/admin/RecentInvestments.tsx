'use client'

interface Investment {
  id: string
  user: string
  userName: string
  plan: string
  amount: string
  date: string
  status: string
}

interface RecentInvestmentsProps {
  investments: Investment[]
}

export default function RecentInvestments({ investments }: RecentInvestmentsProps) {
  if (investments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-gray-400">
          <p>Aucun investissement récent</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {investments.map((investment) => (
        <div key={investment.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{investment.plan}</p>
            <p className="text-xs text-gray-400 truncate">
              {investment.userName || investment.user}
            </p>
            <p className="text-xs text-gray-500 mt-1">{investment.date}</p>
          </div>
          <div className="text-right ml-4 flex-shrink-0">
            <p className="font-medium text-sm">{investment.amount}</p>
            <p className={`text-xs ${
              investment.status === 'ACTIVE' 
                ? 'text-cyan-400' 
                : investment.status === 'COMPLETED'
                ? 'text-green-400'
                : 'text-gray-400'
            }`}>
              {investment.status === 'ACTIVE' 
                ? 'Actif' 
                : investment.status === 'COMPLETED'
                ? 'Terminé'
                : 'Annulé'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
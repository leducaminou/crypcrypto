'use client'

interface Withdrawal {
  id: string
  user: string
  userName: string
  amount: string
  method: string
  date: string
  status: string
}

interface RecentWithdrawalsProps {
  withdrawals: Withdrawal[]
}

export default function RecentWithdrawals({ withdrawals }: RecentWithdrawalsProps) {
  if (withdrawals.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-gray-400">
          <p>Aucun retrait récent</p>
        </div>
      </div>
    )
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Complété'
      case 'PENDING': return 'En attente'
      case 'cancelled': return 'Annulé'
      case 'FAILED': return 'Échoué'
      case 'processing': return 'En traitement'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400'
      case 'PENDING': return 'text-yellow-400'
      case 'processing': return 'text-cyan-400'
      case 'cancelled': return 'text-gray-400'
      case 'FAILED': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="space-y-4">
      {withdrawals.map((withdrawal) => (
        <div key={withdrawal.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{withdrawal.amount}</p>
            <p className="text-xs text-gray-400 truncate">
              {withdrawal.userName || withdrawal.user}
            </p>
            <p className="text-xs text-gray-500 mt-1">{withdrawal.date}</p>
          </div>
          <div className="text-right ml-4 flex-shrink-0">
            <p className="text-xs text-gray-400">{withdrawal.method}</p>
            <p className={`text-xs ${getStatusColor(withdrawal.status)}`}>
              {getStatusText(withdrawal.status)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
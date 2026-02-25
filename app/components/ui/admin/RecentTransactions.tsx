'use client'

interface Transaction {
  id: string
  user: string
  userName: string
  amount: string
  type: string
  date: string
  status: string
  method: string
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-gray-400">
          <p>Aucune transaction récente</p>
        </div>
      </div>
    )
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'Dépôt'
      case 'WITHDRAWAL': return 'Retrait'
      case 'INVESTMENT': return 'Investissement'
      case 'DIVIDEND': return 'Dividende'
      case 'REFERRAL': return 'Parrainage'
      case 'FEE': return 'Frais'
      default: return type
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Complété'
      case 'PENDING': return 'En attente'
      case 'cancelled': return 'Annulé'
      case 'FAILED': return 'Échoué'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400'
      case 'PENDING': return 'text-yellow-400'
      case 'cancelled': return 'text-gray-400'
      case 'FAILED': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{transaction.amount}</p>
            <p className="text-xs text-gray-400 truncate">
              {transaction.userName || transaction.user}
            </p>
            <p className="text-xs text-gray-500 mt-1">{transaction.date}</p>
          </div>
          <div className="text-right ml-4 flex-shrink-0">
            <p className="text-xs text-gray-400">{getTypeText(transaction.type)}</p>
            <p className={`text-xs ${getStatusColor(transaction.status)}`}>
              {getStatusText(transaction.status)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
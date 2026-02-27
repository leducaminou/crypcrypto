import { Transaction, TransactionType, TransactionStatus } from '@/types'

const typeIcons: Record<TransactionType, string> = {
  DEPOSIT: '💰',
  WITHDRAWAL: '💸', 
  INVESTMENT: '💼',
  DIVIDEND: '📈',
  BONUS: '🎁'
}

const statusColors: Record<TransactionStatus, string> = {
  COMPLETED: 'bg-green-900 text-green-400',
  PENDING: 'bg-yellow-900 text-yellow-400',
  FAILED: 'bg-red-900 text-red-400',
  CANCELLED: 'bg-orange-900 text-orange-400',
}

const typeLabels: Record<TransactionType, string> = {
  DEPOSIT: 'Dépôt',
  WITHDRAWAL: 'Retrait',
  INVESTMENT: 'Investissement',
  DIVIDEND: 'Dividende',
  BONUS: 'Bonus'
}

interface TransactionCardProps {
  transaction: Transaction,
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-cyan-500 transition">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-xl">{typeIcons[transaction.type]}</span>
          <div>
            <h3 className="font-medium">{typeLabels[transaction.type]}</h3>
            <p className="text-gray-400 text-sm">{transaction.date}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs ${statusColors[transaction.status]}`}>
          {transaction.status === 'COMPLETED' && 'Complété'}
          {transaction.status === 'PENDING' && 'En attente'}
          {transaction.status === 'FAILED' && 'Échoué'}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div>
          <p className="text-gray-400 text-sm">Montant</p>
          <p className={`font-medium ${
            transaction.type === 'DEPOSIT' || transaction.type === 'DIVIDEND' 
              ? 'text-green-400' 
              : 'text-white'
          }`}>
            {transaction.type === 'WITHDRAWAL' || transaction.type === 'INVESTMENT' ? '-' : '+'}
            {transaction.amount}$
          </p>
        </div>
        {transaction.reference && (
          <div>
            <p className="text-gray-400 text-sm">Référence</p>
            <p className="font-mono text-sm text-gray-300 truncate">{transaction.reference}</p>
          </div>
        )}
      </div>

      {transaction.details && (
        <p className="text-gray-400 text-sm mt-2">{transaction.details}</p>
      )}
    </div>
  )
}
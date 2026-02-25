import { TransactionType, TransactionStatus } from '@/types'

interface HistoryFiltersProps {
  selectedType: TransactionType | 'all'
  selectedStatus: TransactionStatus | 'all'
  onTypeChange: (type: TransactionType | 'all') => void
  onStatusChange: (status: TransactionStatus | 'all') => void
}

export default function HistoryFilters({ 
  selectedType,
  selectedStatus,
  onTypeChange,
  onStatusChange
}: HistoryFiltersProps) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Type de transaction</label>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value as TransactionType | 'all')}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Tous les types</option>
            <option value="DEPOSIT">Dépôts</option>
            <option value="WITHDRAWAL">Retraits</option>
            <option value="INVESTMENT">Investissements</option>
            <option value="DIVIDEND">Dividendes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Statut</label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as TransactionStatus | 'all')}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="COMPLETED">Complétés</option>
            <option value="PENDING">En attente</option>
            <option value="FAILED">Échoués</option>
          </select>
        </div>
      </div>
    </div>
  )
}
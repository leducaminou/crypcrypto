// app/components/ui/admin/DepositFilters.tsx
import { TransactionStatus } from '@/types'
import { getStatusTranslation } from '@/app/lib/utils'

interface DepositFiltersProps {
  selectedStatus: TransactionStatus | 'all'
  onStatusChange: (status: TransactionStatus | 'all') => void
}

export default function DepositFilters({ 
  selectedStatus,
  onStatusChange
}: DepositFiltersProps) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Statut</label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as TransactionStatus | 'all')}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="COMPLETED">{getStatusTranslation('COMPLETED' as TransactionStatus)}</option>
            <option value="PENDING">{getStatusTranslation('PENDING' as TransactionStatus)}</option>
            <option value="FAILED">{getStatusTranslation('FAILED' as TransactionStatus)}</option>
            <option value="CANCELLED">{getStatusTranslation('CANCELLED' as TransactionStatus)}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Tri par date</label>
          <select
            defaultValue="newest"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="newest">Plus récents</option>
            <option value="oldest">Plus anciens</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Méthode de paiement</label>
          <select
            defaultValue="all"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Toutes les méthodes</option>
            <option value="MOBILE">Mobile Money</option>
            <option value="BITCOIN">Bitcoin</option>
            <option value="ETHEREUM">Ethereum</option>
            <option value="USDT">USDT</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Recherche</label>
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>
    </div>
  )
}
import { KycStatus } from '@/types'

interface KycFiltersProps {
  selectedStatus: KycStatus | 'all'
  onStatusChange: (status: KycStatus | 'all') => void
}

export default function KycFilters({ 
  selectedStatus,
  onStatusChange
}: KycFiltersProps) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Statut KYC</label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as KycStatus | 'all')}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvé</option>
            <option value="REJECTED">Rejeté</option>
          </select>
        </div>
      </div>
    </div>
  )
}
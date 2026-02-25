import { ReferralStatus } from '@prisma/client';

interface ReferralFiltersProps {
  selectedStatus: ReferralStatus | 'all';
  onStatusChange: (status: ReferralStatus | 'all') => void;
}

export default function ReferralFilters({ 
  selectedStatus,
  onStatusChange
}: ReferralFiltersProps) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6"> {/* Un seul filtre pour simplifier */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Statut du parrainage</label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as ReferralStatus | 'all')}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="ACTIVE">Actif</option>
            <option value="REWARDED">Récompensé</option>
            <option value="INACTIVE">Inactif</option>
          </select>
        </div>
      </div>
    </div>
  )
}
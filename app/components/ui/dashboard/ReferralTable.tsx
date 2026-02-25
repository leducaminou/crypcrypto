'use client'

import { TableReferral } from '@/app/(dashboards)/dashboard/referrals/page'
import { Referral } from '@/types'

interface ReferralTableProps {
  referrals: TableReferral[]
}

export default function ReferralTable({ referrals }: ReferralTableProps) {
  const getStatusColor = (status: Referral['status']) => {
    switch(status) {
      case 'ACTIVE': return 'bg-green-900 text-green-400'
      case 'PENDING': return 'bg-yellow-900 text-yellow-400'
      case 'REWARDS': return 'bg-cyan-900 text-cyan-400'
      default: return 'bg-gray-700 text-gray-400'
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-700">
            <th className="p-4">Email</th>
            <th className="p-4">Date d'inscription</th>
            <th className="p-4">Statut</th>
            <th className="p-4 text-right">Gains</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((referral) => (
            <tr key={referral.id} className="border-b border-gray-700 hover:bg-gray-700/50">
              <td className="p-4">{referral.email}</td>
              <td className="p-4">{referral.signupDate}</td>
              <td className="p-4">
                <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(referral.status)}`}>
                  {referral.status === 'ACTIVE' && 'Actif'}
                  {referral.status === 'PENDING' && 'En attente'}
                  {referral.status === 'REWARDS' && 'Récompensé'}
                </span>
              </td>
              <td className="p-4 text-right font-medium">
                {referral.earnedAmount || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
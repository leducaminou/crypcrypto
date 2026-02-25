'use client'
import { getStatusColor, getStatusTranslation } from '@/app/lib/utils'
import { RecentActivity } from '@/types'

interface AdminActivityTableProps {
  activities: RecentActivity[]
}

export default function AdminActivityTable({ activities }: AdminActivityTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-700">
            <th className="pb-2">Action</th>
            <th className="pb-2">Utilisateur</th>
            <th className="pb-2">Date</th>
            <th className="pb-2">Statut</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => (
            <tr key={activity.id} className="border-b border-gray-700 hover:bg-gray-700/50">
              <td className="py-3 text-sm">{activity.action}</td>
              <td className="py-3 text-sm text-gray-400">{activity.user}</td>
              <td className="py-3 text-sm">{activity.date}</td>
              <td className="py-3">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  getStatusColor(activity.status)}`}>
                  {getStatusTranslation(activity.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
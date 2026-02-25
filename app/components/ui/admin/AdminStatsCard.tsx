import { AdminStat } from "@/types"

interface AdminStatsCardProps {
  stat: AdminStat
}

export default function AdminStatsCard({ stat }: AdminStatsCardProps) {
  const isPositive = !stat.change.startsWith('-')

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-cyan-500 transition">
      <div className="flex justify-between">
        <div>
          <p className="text-gray-400 text-sm">{stat.title}</p>
          <p className="text-2xl font-bold mt-2">{stat.value}</p>
        </div>
        <div className="w-12 h-12 bg-cyan-900 bg-opacity-30 rounded-lg flex items-center justify-center text-cyan-400">
          {stat.icon}
        </div>
      </div>
      <p className={`text-sm mt-4 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {stat.change} {isPositive ? '↑' : '↓'}
      </p>
    </div>
  )
}
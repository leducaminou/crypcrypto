export default function StatsCard({ title, value, change, icon }: {
  title: string
  value: string
  change: string
  icon: React.ReactNode
}) {
  const isPositive = change.startsWith('+')

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <div className="flex justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-lg lg:text-md 2xl:text-2xl  font-bold mt-2">{value}</p>
          <p className={`text-sm mt-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {change}
          </p>
        </div>
        <div className="w-12 h-12 bg-cyan-900 bg-opacity-30 rounded-lg flex items-center justify-center text-cyan-400">
          {icon}
        </div>
      </div>
    </div>
  )
}
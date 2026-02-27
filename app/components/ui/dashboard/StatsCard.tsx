export default function StatsCard({
  title,
  value,
  change,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}) {
  const isPositive = change.startsWith("+");

  return (
    <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-700 p-4 md:p-6 shadow-xl hover:bg-gray-800 transition-all duration-300 group">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="p-2.5 rounded-xl bg-gray-700 text-indigo-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-300 transition-all duration-300">
            {icon}
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${isPositive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}
          >
            {change}
          </span>
        </div>

        <div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

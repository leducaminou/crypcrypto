// app\components\ui\dashboard\ReferralStatsCard.tsx
interface ReferralStatsCardProps {
  stats: {
    totalReferrals: number;
    activeReferrals: number;
    totalEarned: string;
    pendingRewards: string;
  };
}

export default function ReferralStatsCard({ stats }: ReferralStatsCardProps) {
  const {
    totalReferrals = 0,
    activeReferrals = 0,
    totalEarned = "$0.00",
    pendingRewards = "0.00$",
  } = stats;

  const statsItems = [
    {
      label: "Total des filleuls",
      value: totalReferrals.toString(),
      description: "Inscrits via votre lien",
    },
    {
      label: "Filleuls actifs",
      value: activeReferrals.toString(),
      description: "Avec au moins un dépôt",
    },
    {
      label: "Gains accumulés",
      value: totalEarned,
      description: "Commissions directes",
    },
    {
      label: "Récompenses",
      value: pendingRewards,
      description: "En attente de validation",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statsItems.map((item, index) => (
        <div
          key={index}
          className="bg-gray-800 hover:bg-gray-700 rounded-2xl p-4 border border-gray-700 transition-all duration-300"
        >
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            {item.label}
          </p>
          <p className="text-lg font-bold mt-2 text-white">{item.value}</p>
          <p className="text-gray-500 text-[10px] mt-1">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}

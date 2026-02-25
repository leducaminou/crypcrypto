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
    totalEarned = '$0.00',
    pendingRewards = '0.00$'
  } = stats;

  const statsItems = [
    {
      label: "Total des filleuls",
      value: totalReferrals.toString(),
      description: "Personnes inscrites via votre lien"
    },
    {
      label: "Filleuls actifs",
      value: activeReferrals.toString(),
      description: "Filleuls avec dépôt"
    },
    {
      label: "Total gagné",
      value: totalEarned,
      description: "Revenus de parrainage"
    },
    {
      label: "Récompenses en attente",
      value: pendingRewards,
      description: "Gains non distribués"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {statsItems.map((item, index) => (
        <div key={index} className="bg-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm">{item.label}</p>
          <p className="text-lg font-bold mt-1 text-cyan-400">{item.value}</p>
          <p className="text-gray-500 text-xs mt-1">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
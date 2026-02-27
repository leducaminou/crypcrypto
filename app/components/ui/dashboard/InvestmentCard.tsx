import { formatMonetary } from "@/app/lib/utils";
import Link from "next/link";

interface InvestmentCardProps {
  name: string;
  amount: string;
  dailyProfit: string;
  totalProfit: string;
  totalProfitCalculated?: string; // Nouvelle prop optionnelle
  duration: string;
  remainingDays: number;
  status: "ACTIVE" | "COMPLETED";
  id?: number;
}

export default function InvestmentCard({
  name,
  amount,
  dailyProfit,
  totalProfit,
  totalProfitCalculated,
  duration,
  remainingDays,
  status,
}: InvestmentCardProps) {
  // Utiliser le profit calculé basé sur les jours écoulés
  const displayTotalProfit = totalProfitCalculated || totalProfit;
  const isCompleted = status === "COMPLETED";

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 p-5 md:p-6 hover:border-primary/20 transition-all duration-300 shadow-xl group">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white group-hover:text-primary transition-colors">
          {name}
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
            !isCompleted
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "bg-white/5 text-lightblue border-white/10"
          }`}
        >
          {!isCompleted ? "Actif" : "Terminé"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-6">
        <div>
          <p className="text-lightblue text-[10px] font-bold uppercase tracking-widest mb-1">
            Investi
          </p>
          <p className="text-white font-bold">${formatMonetary(amount)}</p>
        </div>
        <div className="text-right">
          <p className="text-lightblue text-[10px] font-bold uppercase tracking-widest mb-1">
            Profit/Jour
          </p>
          <p className="text-secondary font-bold">
            +${formatMonetary(dailyProfit)}
          </p>
        </div>
        <div>
          <p className="text-lightblue text-[10px] font-bold uppercase tracking-widest mb-1">
            Rendement actuel
          </p>
          <div className="flex items-center gap-2">
            <p className="text-white font-bold">
              ${formatMonetary(displayTotalProfit)}
            </p>
            {!isCompleted && (
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lightblue text-[10px] font-bold uppercase tracking-widest mb-1">
            Durée
          </p>
          <p className="text-white font-bold">{duration}</p>
        </div>
      </div>

      {!isCompleted && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
            <span className="text-lightblue">Progression</span>
            <span className="text-white">{remainingDays} jours restants</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-full rounded-full shadow-[0_0_10px_rgba(189,36,223,0.3)] transition-all duration-1000"
              style={{
                width: `${Math.min(100, 100 - (remainingDays / parseInt(duration)) * 100)}%`,
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

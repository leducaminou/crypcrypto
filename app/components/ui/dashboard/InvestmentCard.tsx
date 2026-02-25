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

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-cyan-500 transition">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold">{name}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs ${
            status === "ACTIVE"
              ? "bg-cyan-900 text-cyan-400"
              : "bg-gray-700 text-gray-400"
          }`}
        >
          {status === "ACTIVE" ? "Actif" : "Terminé"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-gray-400 text-sm">Investissement</p>
          <p className="font-medium">
            {formatMonetary(amount)}
            $
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-sm text-right">Profit quotidien</p>
          <p className="text-cyan-400 font-medium text-right">
            {formatMonetary(dailyProfit)}
            $
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Profit total</p>
          <p className="font-medium">
            {formatMonetary(displayTotalProfit)}
            $
          </p>
          <p className="text-xs text-gray-500 mt-1">
            (Calculé sur les jours écoulés)
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-sm text-right">Durée</p>
          <p className="font-medium text-right">{duration}</p>
        </div>
      </div>

      {status === "ACTIVE" && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>Progression</span>
            <span>{remainingDays} jours restants</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-cyan-500 h-2 rounded-full"
              style={{
                width: `${100 - (remainingDays / parseInt(duration)) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      )}
      {/* {status === "ACTIVE" && (
        <Link
          href="#"
          className="inline-block w-full py-2 text-center rounded-lg bg-gray-700 hover:bg-gray-600 transition"
        >
          Voir les détails
        </Link>
      )} */}
    </div>
  );
}
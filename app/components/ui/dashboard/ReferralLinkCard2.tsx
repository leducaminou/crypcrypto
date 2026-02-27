"use client";

import { copyToClipboard } from "@/app/lib/copyToClipboard";
import { useState } from "react";

interface ReferralLinkCardProps {
  referralLink: string;
}

export default function ReferralLinkCard2({
  referralLink,
}: ReferralLinkCardProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyClick = async (): Promise<void> => {
    try {
      await copyToClipboard(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Échec de la copie:", err);
      // Vous pourriez ajouter un toast ou un message d'erreur ici
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700 hover:border-indigo-500/50 transition-all duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="text-center sm:text-left">
          <p className="font-bold text-white mb-1">
            Votre lien de parrainage unique
          </p>
          <p className="text-gray-400 text-sm">
            Partagez ce lien et gagnez instantanément{" "}
            <span className="text-indigo-400 font-bold">5%</span> de commission.
          </p>
        </div>

        <button
          onClick={handleCopyClick}
          className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg ${
            copied
              ? "bg-green-500 text-white shadow-green-500/20"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 hover:scale-105 active:scale-95"
          }`}
          aria-label={copied ? "Lien copié" : "Copier le lien de parrainage"}
        >
          {copied ? "Lien Copié !" : "Copier le Lien"}
        </button>
      </div>
    </div>
  );
}

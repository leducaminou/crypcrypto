"use client";
import Sidebar from "@/app/components/ui/dashboard/Sidebar";
import DashboardHeader from "@/app/components/ui/dashboard/Header";
import ReferralStatsCard from "@/app/components/ui/dashboard/ReferralStatsCard";
import ReferralLinkCard from "@/app/components/ui/dashboard/ReferralLinkCard";
import ReferralTable from "@/app/components/ui/dashboard/ReferralTable";
import {
  Referral,
  ReferralStats,
  UserResponse,
  UserResponseNew,
} from "@/types";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useIdContext } from "@/app/components/wrapper/ClientWrapper";
import { useRoleGuard } from "@/app/lib/utils/role-guard";
import { useToast } from "@/hooks/use-toast";
import { Roles } from "@/app/lib/auth.config";
import LoadingSpiner from "@/app/components/ui/LoadingSpiner";
import EmptyState from "@/app/components/ui/dashboard/EmptyState";
import SectionLoadingSpinner from "@/app/components/ui/SectionLoadingSpinner";
import SectionError from "@/app/components/ui/SectionError";
import PageLoadingSpiner from "@/app/components/ui/PageLoadingSpiner";
export interface TableReferral {
  id: string;
  email: string;
  signupDate: string;
  status: "ACTIVE" | "PENDING" | "REWARDS";
  earnedAmount: string;
}
// Interface pour les paramètres système
interface SystemSettings {
  registration_bonus_percentage: string;
  referral_bonus_percentage: string;
}
export default function ReferralsPage() {
  useRoleGuard([Roles.USER]);
  const id = useIdContext();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableReferrals, setTableReferrals] = useState<TableReferral[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    pendingRewards: "0.00",
    totalEarned: "0.00",
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    registration_bonus_percentage: "0",
    referral_bonus_percentage: "0",
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const { showSuccess, showError } = useToast();
  const REFERRAL_LINK = process.env.NEXT_PUBLIC_REFERRAL_LINK;
  // Fonction pour récupérer les paramètres système
  const fetchSystemSettings = async () => {
    try {
      setSettingsLoading(true);
      // Récupérer tous les paramètres système
      const response = await fetch("/api/system-settings");
      if (!response.ok) {
        throw new Error("Failed to fetch system settings");
      }
      const data = await response.json();
      if (data.success && data.data) {
        // Transformer le tableau en objet pour un accès facile
        const settingsMap: any = {};
        data.data.forEach((setting: any) => {
          settingsMap[setting.key] = setting.value;
        });
        setSystemSettings({
          registration_bonus_percentage:
            settingsMap.registration_bonus_percentage || "0",
          referral_bonus_percentage:
            settingsMap.referral_bonus_percentage || "0",
        });
      }
    } catch (err) {
      console.error("Error fetching system settings:", err);
      // Ne pas bloquer l'interface utilisateur si les paramètres échouent
      // Utiliser les valeurs par défaut
    } finally {
      setSettingsLoading(false);
    }
  };
  // Fonction alternative pour récupérer un paramètre spécifique
  const fetchSpecificSetting = async (key: string): Promise<string | null> => {
    try {
      const response = await fetch(
        `/api/admin/system-settings/${encodeURIComponent(key)}`
      );
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      if (data.success && data.data) {
        return data.data.value;
      }
      return null;
    } catch (err) {
      console.error(`Error fetching setting ${key}:`, err);
      return null;
    }
  };
  // Fonction pour récupérer tous les paramètres en une seule fois
  // (Alternative non utilisée actuellement ; décommentez si besoin)
  /*
  const fetchAllSettingsAtOnce = async () => {
    try {
      setSettingsLoading(true);
      const [registrationBonusResponse, referralBonusResponse] =
        await Promise.all([
          fetchSpecificSetting("registration_bonus_percentage"),
          fetchSpecificSetting("referral_bonus_percentage"),
        ]);
      setSystemSettings({
        registration_bonus_percentage: registrationBonusResponse || "0",
        referral_bonus_percentage: referralBonusResponse || "0",
      });
    } catch (err) {
      console.error("Error fetching all settings:", err);
    } finally {
      setSettingsLoading(false);
    }
  };
  */
  // Memoïser la fonction de fetch pour éviter recréations inutiles
  const fetchUserAndReferrals = useCallback(async () => {
    // Debug temporaire : Compte les lancements du useEffect pour confirmer pas de boucle
    // (Retire ce log en prod une fois le problème résolu)


    try {
      if (!id) {
        throw new Error("User ID is not available");
      }
      // Récupérer les paramètres système et les données utilisateur en parallèle
      await Promise.all([
        fetchSystemSettings(), // Utilise la méthode qui récupère tous les paramètres
        // Ou utiliser: fetchAllSettingsAtOnce() pour une approche différente
        (async () => {
          const response = await fetch(`/api/user/${id}`);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              response.status === 404
                ? "User not found"
                : `Failed to fetch data: ${errorText}`
            );
          }
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            setReferralCode(`${REFERRAL_LINK}${data.user.referral_code}`);
          }
          if (data.referredUsers) {
            // Transform referred users to match the table format
            const transformedReferrals = data.referredUsers.map(
              (user: UserResponseNew) =>
                ({
                  id: user.id,
                  email: user.email,
                  signupDate: new Date(user.created_at).toLocaleDateString(
                    "fr-FR"
                  ),
                  status: user.is_active ? "ACTIVE" : "PENDING",
                  earnedAmount: `0.00$`, // Vous pouvez mettre à jour cela plus tard avec les données réelles
                } as TableReferral)
            );
            setTableReferrals(transformedReferrals);
            // Update stats
            setReferralStats({
              totalReferrals: data.referredUsers.length,
              activeReferrals: data.referredUsers.filter(
                (u: UserResponseNew) => u.is_active
              ).length,
              pendingRewards: `0.00$`, // Mettre à jour avec les données réelles si disponibles
              totalEarned: `0.00$`, // Mettre à jour avec les données réelles si disponibles
            });
          }
        })(),
      ]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id, REFERRAL_LINK]); // Dépendances stables pour useCallback

  useEffect(() => {
    if (id) {
      fetchUserAndReferrals();
    } else {
      setError("User ID is not available");
      setLoading(false);
    }
  }, [id, REFERRAL_LINK, fetchUserAndReferrals]); // Retiré showError pour briser la boucle ; fetchUserAndReferrals est memoïsé

  // Tous les hooks doivent être appelés inconditionnellement ici, avant le return
  // Memoïser les calculs de bonus pour optimiser (se recalculent seulement si systemSettings change)
  const { registrationBonus, referralBonus } = useMemo(() => {
    return {
      registrationBonus: parseFloat(systemSettings.registration_bonus_percentage) || 0,
      referralBonus: parseFloat(systemSettings.referral_bonus_percentage) || 0,
    };
  }, [systemSettings]);

  // Structure du return : Conditions gérées via ternaires pour éviter early returns et garder hooks order fixe
  return (
    <>
      {loading || !referralCode ? (
        <SectionLoadingSpinner />
      ) : error ? (
        <SectionError error={error} />
      ) : (
        <div className="flex flex-col gap-0 text-white mt-28">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Programme de parrainage</h1>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <ReferralLinkCard referralLink={referralCode} />
            </div>
            <div className="mt-4">
              <ReferralStatsCard stats={referralStats} />
              {tableReferrals.length === 0 ? (
                <EmptyState
                  title="Vous n'avez aucun filleul"
                  description="Vos filleuls ici."
                />
              ) : (
                <ReferralTable referrals={tableReferrals} />
              )}
            </div>
          </div>
          <div className="mt-8 bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Comment ça marche ?</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              <li>Partagez votre lien de parrainage avec vos amis</li>
              {referralBonus && (
                <li>
                  {`Vous gagnez ${referralBonus}% de bonus sur leur premier dépôt`}
                </li>
              )}
              {registrationBonus && (
                <li>
                  {`Vous gagnez ${registrationBonus}% sur chacun de leur dépot`}
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
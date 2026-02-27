"use client";
import { Stethoscope, Tablets, Mail } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import WalletForm from "./WalletForm";
import CryptoForm from "./CryptoForm";
import { authorizedMobilePayment, CONTACT_EMAIL } from "@/app/lib/constants";
import SectionLoadingSpinner from "../SectionLoadingSpinner";

type ModalContent = {
  type: "create" | "update";
  wallet: any;
  user_id?: any;
  onModalClose?: () => void;
  onSuccess?: (data?: any) => void;
};

interface UserCountry {
  id?: string;
  dial_code?: string;
  country_code?: string;
}

// Props pour le composant WalletChoiceButton
type WalletChoiceButtonProps = {
  tabId: string;
  icon: React.ReactElement<{ color?: string }>;
  label: string;
  activeColor: string | null;
  handleActive: (
    tab: string,
  ) => (e: React.MouseEvent<HTMLButtonElement>) => void;
};

// Composant réutilisable pour les boutons de service
const WalletChoiceButton: React.FC<WalletChoiceButtonProps> = ({
  tabId,
  icon,
  label,
  activeColor,
  handleActive,
}) => {
  const isActive = activeColor === tabId;
  return (
    <button
      className={
        isActive
          ? "w-full flex items-center justify-center gap-1 scShadow p-2 md:py-6 rounded-lg bg-gray-800 text-cyan-500 border border-cyan-500 font-semibold relative"
          : "w-full flex items-center justify-center gap-1 scShadow p-2 md:py-6 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-sm font-semibold relative"
      }
      onClick={handleActive(tabId)}
    >
      {React.cloneElement(icon, {
        color: isActive ? "#06b6d4" : "#fff",
      })}
      {label}
    </button>
  );
};

const ChoiceWalletChoiceButtons = ({
  type,
  wallet,
  user_id,
  onModalClose,
  onSuccess,
}: ModalContent) => {
  const [activeTab, setActiveTab] = useState<string>("");
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<UserCountry | null>(null);
  const [kycStatus, setKycStatus] = useState<string>("PENDING");

  const fetchUserCountry = useCallback(async () => {
    try {
      const response = await fetch(`/api/user/${user_id}`);
      if (!response.ok) throw new Error("Failed to fetch user data");
      const userData = await response.json();
      setUserCountry(userData.user.country || null);
      if (userData.kycVerification) {
        setKycStatus(userData.kycVerification.status);
      }
    } catch (error) {
      console.error("Error fetching user country:", error);
    }
  }, [user_id]);

  useEffect(() => {
    fetchUserCountry();
  }, [fetchUserCountry]);

  const isAuthorizedMobilePayment = useMemo(() => {
    if (!userCountry?.dial_code) return false;
    const dialCode = userCountry.dial_code;
    return authorizedMobilePayment.includes(dialCode);
  }, [userCountry]);

  const handleActive = (tab: string) => {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setActiveTab(tab);
      setActiveColor(tab);
    };
  };

  if (!userCountry) return <SectionLoadingSpinner />;

  return (
    <div className="w-full flex flex-col gap-4">
      <h2 className="font-semibold text-md md:text-xl text-center mb-4">
        Sélectionner un moyen de paiement
      </h2>

      <div className="w-full flex flex-col md:flex-row justify-center items-center gap-4">
        {/* Mobile payment: only for Cameroon (+237) */}
        {isAuthorizedMobilePayment ? (
          <WalletChoiceButton
            tabId="mobile"
            icon={<Stethoscope />}
            label="Paiement mobile"
            activeColor={activeColor}
            handleActive={handleActive}
          />
        ) : (
          <div className="w-full flex flex-col items-center gap-2 p-4 rounded-xl bg-yellow-900/20 border border-yellow-500/30">
            <div className="flex items-center gap-2 text-yellow-400">
              <Mail size={16} />
              <span className="text-sm font-semibold">Paiement mobile</span>
            </div>
            <p className="text-yellow-300 text-xs text-center">
              Le paiement mobile n&apos;est pas encore disponible dans votre
              pays.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-cyan-400 hover:text-cyan-300 text-xs underline transition-colors"
            >
              Contactez-nous : {CONTACT_EMAIL}
            </a>
          </div>
        )}

        <WalletChoiceButton
          tabId="crypto"
          icon={<Tablets />}
          label="Paiement par crypto"
          activeColor={activeColor}
          handleActive={handleActive}
        />
      </div>

      <div className="pt-8">
        {activeTab === "mobile" && isAuthorizedMobilePayment && (
          <WalletForm
            wallet={wallet}
            type="create"
            user_id={user_id}
            userCountry={userCountry}
            kycStatus={kycStatus}
            onModalClose={onModalClose}
            onSuccess={onSuccess}
          />
        )}
        {activeTab === "crypto" && (
          <CryptoForm
            wallet={wallet}
            type="create"
            user_id={user_id}
            kycStatus={kycStatus}
            onModalClose={onModalClose}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default ChoiceWalletChoiceButtons;

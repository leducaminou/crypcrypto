"use client";
import React, { useCallback, useEffect, useState } from "react";

import { Countries } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import LinkWithModal from "@/app/components/modal/LinkWithModal";
import PasswordForm from "@/app/components/ui/forms/PasswordForm";
import ProfileForm from "@/app/components/ui/forms/ProfileForm";
import TwoAuthFactorForm from "@/app/components/ui/forms/TwoAuthFactorForm";
import SectionLoadingSpinner from "@/app/components/ui/SectionLoadingSpinner";
import SectionError from "@/app/components/ui/SectionError";
import { UserResponse } from "@/types";
import { useRouter } from "next/navigation";
import { useIdContext } from "@/app/components/wrapper/ClientWrapper";
import { useRoleGuard } from "@/app/lib/utils/role-guard";
import { Roles } from "@/app/lib/auth.config";
import { useSession } from "next-auth/react";
import KycVerificationForm from "@/app/components/ui/forms/KycVerificationForm";
import PaymentMethodForm from "@/app/components/ui/forms/PaymentMethodForm";
import ButtonWithModal from "@/app/components/modal/ButtonWithModal";
import PaymentAccountList from "@/app/components/ui/PaymentAccountList";
import { AlertTriangle } from "lucide-react";

export default function ProfilePage() {
  useRoleGuard([Roles.USER]);
  const id = useIdContext();

  const router = useRouter();

  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Countries[]>([]);
  const { showSuccess, showError } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    router.refresh();
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!id) {
          throw new Error("User ID is not available");
        }

        setLoading(true);
        const response = await fetch(`/api/user/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            response.status === 404
              ? "User not found"
              : `Failed to fetch user: ${errorText}`,
          );
        }

        const data: UserResponse = await response.json();
        setUser(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user data:", error);
        showError("Failed to data");
      }
    };

    const fetchCountries = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/countries");
        if (!response.ok) throw new Error("Failed to fetch countries");
        const data = await response.json();
        setCountries(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching countries:", error);
        showError("Failed to data");
      }
    };

    const fetchData = async () => {
      await Promise.all([fetchCountries(), fetchUser()]);
      setLoading(false);
    };

    if (id) {
      fetchData();
    } else {
      setError("User ID is not available");
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    console.log("user", user);
  }, [id]);

  if (!user || !countries || loading) return <SectionLoadingSpinner />;

  if (error) return <SectionError error={error} />;

  return (
    <div className="flex flex-col gap-0  text-white mt-28">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Mon profil</h1>
      </div>

      {/* Alerte KYC */}
      {user && user.kycVerification?.status !== "APPROVED" && (
        <div className="mb-6 bg-yellow-900/20 border border-yellow-500/50 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-yellow-500/20 flex flex-shrink-0 items-center justify-center text-yellow-500">
              <AlertTriangle size={20} />
            </span>
            <div>
              <h3 className="text-yellow-500 font-bold">Vérification d&apos;identité requise</h3>
              <p className="text-yellow-400/80 text-sm">
                Votre compte n&apos;est pas encore vérifié. Vos dépôts et retraits sont limités à 25$. Complétez la vérification dans la section ci-dessous.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col md:flex-row gap-6">
        <div className="w-full flex flex-col gap-6 md:w-2/3">
          <ProfileForm type="update" user={user} countries={countries} />
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <PaymentAccountList userId={id} />
          </div>
        </div>
        <div className=" w-full md:w-1/3 flex flex-col gap-6">
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">
                Documents officiels
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Mot de passe</p>
                    <p className="text-gray-400 text-sm">
                      Dernière modification: 15/06/2023
                    </p>
                  </div>

                  <LinkWithModal
                    title="Modifier"
                    content={<PasswordForm id={user.user.id} />}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">
                Verification d'identité
              </h3>
              <h4>Status</h4>
              <div className="space-y-4">
                <KycVerificationForm type="update" id={user.user.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

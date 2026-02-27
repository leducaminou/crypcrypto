"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import InputField from "@/app/components/inputs/InputField";
import InputPassword from "@/app/components/inputs/InputPasword";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  RegisterSchema,
  RegisterSchemaType,
} from "@/app/lib/validations/AuthSchema";
import PhoneField from "@/app/components/inputs/PhoneField";
import SelectField from "@/app/components/inputs/SelectField";
import Button from "@/app/components/ui/Button";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import ReferralNotExist from "@/app/components/ui/ReferralNotExist";
import { Countries } from "@prisma/client";
import PageLoadingSpiner from "@/app/components/ui/PageLoadingSpiner";
import ButtonLink from "@/app/components/ui/ButtonLink";

const RegisterClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [isRreferalExist, setIsRreferalExist] = useState(true);
  const [countries, setCountries] = useState<Countries[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      referred_code: searchParams.get("ref") || "",
    },
  });

  const fetchCountries = useCallback(async () => {
    try {
      const response = await fetch("/api/countries");
      if (!response.ok) throw new Error("Failed to fetch countries");
      const data = await response.json();
      setCountries(data);
    } catch (error) {
      console.error("Error fetching countries:", error);
      showError("Failed to load countries");
    }
  }, [showError]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const passwordValue = watch("password");

  const onSubmit = async (data: RegisterSchemaType) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        console.log("Registration error status:", response.status);
        if (response.status === 404) {
          setIsRreferalExist(false);
        }
        throw new Error(result.error || "Erreur lors de l'inscription");
      }

      showSuccess("Compte créé avec succès!");
      router.push("/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      showError(
        error.message ||
          "Une erreur est survenue lors de la création du compte",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!countries || countries.length === 0) return <PageLoadingSpiner />;

  return (
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8 h-screen ">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Créer un compte
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Commencez votre expérience d'investisseur
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <InputField
              id="email"
              name="email"
              type="email"
              label="Adresse email"
              autoComplete="email"
              register={register}
              error={errors.email}
              placeholder="exemple@domain.com"
              transform={(value: string) => value.toLowerCase()}
              required
            />

            <SelectField
              id="country_id"
              name="country_id"
              label="Pays de résidence"
              register={register}
              error={errors.country_id}
              options={countries}
              valueKey="id"
              textKey="name"
              placeholder="Sélectionnez votre pays"
              required
            />

            <PhoneField
              countries={countries}
              register={register}
              errors={errors}
              transform={(value: string) => value.replace(/\s+/g, "")}
              required
            />

            <InputField
              id="referred_code"
              name="referred_code"
              type="text"
              label="Code parrainage"
              register={register}
              error={errors.referred_code}
              placeholder="Code de parrainage"
            />

            <InputPassword
              id="password"
              name="password"
              label="Mot de passe"
              autoComplete="new-password"
              register={register}
              error={errors.password}
              required
            />

            <InputPassword
              id="confirmPassword"
              name="confirmPassword"
              label="Confirmer le mot de passe"
              autoComplete="current-password"
              disclaimer
              register={register}
              error={errors.confirmPassword}
              validate={(value: string) =>
                value === passwordValue ||
                "Les mots de passe ne correspondent pas"
              }
              required
            />

            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                {...register("terms")}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded bg-gray-700"
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-300"
              >
                J'accepte les{" "}
                <Link
                  href="/terms"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  conditions d'utilisation
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="mt-1 text-sm text-red-400">
                {errors.terms.message}
              </p>
            )}

            <div>
              <Button
                variant="primary"
                type="submit"
                className="text-white"
                fullWidth
                disabled={loading}
              >
                {loading ? "Création en cours..." : "S'inscrire"}
              </Button>
            </div>
            <ReferralNotExist hidden={isRreferalExist} />
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">
                  Vous avez déjà un compte?
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <ButtonLink
                href="/login"
                variant="secondary"
                className="text-white"
                fullWidth
              >
                Se connecter
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterClient;

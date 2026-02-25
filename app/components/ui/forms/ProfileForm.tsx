// app/components/ui/forms/ProfileForm.tsx
"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../../inputs/InputField";

import { Countries, InvestmentPlan, User } from "@prisma/client";
import SelectField from "../../inputs/SelectField";
import SubmitFormButton from "../SubmitFormButton";
import Image from "next/image";
import { countryList } from "@/app/lib/utils";

import LinkWithModal from "../../modal/LinkWithModal";
import KycVerificationForm from "./KycVerificationForm";
import PhoneField from "../../inputs/PhoneField";
import { useToast } from "@/hooks/use-toast";
import { UserResponse } from "@/types";
import { UserProfileSchema, UserProfileSchemaType } from "@/app/lib/validations/ProfileShema";
import { genderList } from "@/app/lib/constants";

interface FormProps {
  user: UserResponse;
  countries: Countries[];
  type: "create" | "update";
  onSuccess?: () => void;
}
export default function ProfileForm({
  user,
  countries,
  type = "update",
  onSuccess,
}: FormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    watch,
  } = useForm<UserProfileSchemaType>({
    resolver: zodResolver(UserProfileSchema),
    defaultValues: {
      user_id: user.user.id,
      first_name: user.user.first_name || "",
      last_name: user.user.last_name || "",
      email: user.user.email,
      phone: user.user.phone || "",
      gender: user.user.profile?.gender || undefined,
      date_of_birth: user.user.profile?.date_of_birth 
        ? new Date(user.user.profile.date_of_birth).toISOString().split('T')[0]
        : "",
      address: user.user.profile?.address || "",
      city: user.user.profile?.city || "",
      postal_code: user.user.profile?.postal_code || "",
      country_id: user.user.country?.id?.toString() || "",
    },
  });
  

  console.log('user', user)

  const [actionState, setActionState] = useState<{
    success: boolean;
    error: string | null;
  }>({
    success: false,
    error: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (formData: UserProfileSchemaType) => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/user/update/${user.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour');
      }

      const result = await response.json();
      showSuccess('Profil mis à jour avec succès');
      setActionState({ success: true, error: null });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message);
      showError(error.message || 'Erreur lors de la mise à jour');
      setActionState({ success: false, error: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              id="first_name"
              name="first_name"
              type="text"
              label="Prénom"
              required
              register={register}
              error={errors.first_name}
            />

            <InputField
              id="last_name"
              name="last_name"
              type="text"
              label="Nom"
              required
              register={register}
              error={errors.last_name}
            />
          </div>

          <InputField
            id="email"
            name="email"
            type="email"
            label="Email"
            required
            register={register}
            error={errors.email}
          />

          <PhoneField
            countries={countries}
            required
            register={register}
            errors={errors}
            transform={(value: string) => value.replace(/\s+/g, '')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">  
            <SelectField
              id="gender"
              name="gender"
              label="Genre"
              options={genderList}
              required
              register={register}
              error={errors.gender}
              valueKey="id"
              textKey="name"
              full
            />
            <InputField
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              label="Naissance"
              required
              register={register}
              error={errors.date_of_birth}
            />  
          </div>

          <InputField
            id="address"
            name="address"
            type="text"
            label="Adresse"
            register={register}
            error={errors.address}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              id="city"
              name="city"
              type="text"
              label="Ville"
              register={register}
              error={errors.city}
            />

            <InputField
              id="postal_code"
              name="postal_code"
              type="text"
              label="Code postal"
              register={register}
              error={errors.postal_code}
            />
          </div>

      

          {error && (
            <div className="bg-red-900 text-red-400 p-3 rounded-lg">
              {error}
            </div>
          )}

          {actionState.success && (
            <div className="bg-green-900 text-green-400 p-3 rounded-lg">
              Profil mis à jour avec succès
            </div>
          )}

          <div>
            <SubmitFormButton
              submitting={isSubmitting || loading}
              type={type}
              title="Mettre à jour"
              disabled={isSubmitting || loading}
            />
          </div>
        </form>
      </div>

      <div className="border-t border-gray-700 pt-6">
        <h3 className="text-lg font-semibold mb-4">Vérification d'identité</h3>
        <div className={`p-4 rounded-lg ${
          user?.user.is_email_verified 
            ? 'bg-green-900 text-green-400' 
            : 'bg-yellow-900 text-yellow-400'
        }`}>
          {user?.user.is_email_verified ? (
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Votre identité a été vérifiée
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Vérification d'identité requise
              </div>
              
              <LinkWithModal 
                title="Compléter la vérification"
                color="text-yellow-400"
                content={<KycVerificationForm id={user.user.id} type="create" />}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from '../../inputs/InputField';
import { useForm } from "react-hook-form";
import { paymentAccountSchema, PaymentAccountSchemaType } from '@/app/lib/validations/PaymentAccountSchema';
import { AllFormProps } from '@/types';
import { PaymentMethod } from "@prisma/client";
import SelectField from "../../inputs/SelectField";
import SubmitFormButton from "../SubmitFormButton";
import { useToast } from "@/hooks/use-toast";
import SectionLoadingSpinner from "../SectionLoadingSpinner";

interface FormProps extends AllFormProps {
  onModalClose?: () => void;
  onSuccess?: (data?: any) => void;
  user_id: string;
  id?: string;
  type: "update" | "create";
}

const PaymentMethodForm = ({ type, id, user_id, onSuccess, onModalClose }: FormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    watch,
    trigger,
  } = useForm<PaymentAccountSchemaType>({
    resolver: zodResolver(paymentAccountSchema),
    defaultValues: {
      user_id,
      type: PaymentMethod.CRYPTO,
      is_default: false,
    },
  });

  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(type === "update");
  const [updatingFields, setUpdatingFields] = useState(false);

  const selectedType = watch('type');
  const provider = watch('provider');

  // Options pour les types de paiement
  const paymentTypeOptions = useMemo(() => [
    { id: PaymentMethod.CRYPTO, title: "Crypto-monnaie" },
    { id: PaymentMethod.MOBILE, title: "Compte mobile Money" },
  ], []);

  // Options pour les crypto-monnaies
  const cryptoCurrencyOptions = useMemo(() => [
    { id: "BITCOIN", title: "Bitcoin (BTC)" },
    { id: "ETHEREUM", title: "Ethereum (ETH)" },
    { id: "USDT", title: "Tether (USDT)" },
    { id: "OTHER", title: "Autre crypto" },
  ], []);

  // Options pour les providers mobile money
  const mobileProviderOptions = useMemo(() => [
    { id: "Orange Money", title: "Orange Money" },
    { id: "MTN Money", title: "MTN Money" },
  ], []);

  // Options pour les providers crypto
  const cryptoProviderOptions = useMemo(() => [
    { id: "Binance", title: "Binance" },
    { id: "Trust Wallet", title: "Trust Wallet" },
    { id: "MetaMask", title: "MetaMask" },
    { id: "Ledger", title: "Ledger" },
    { id: "OTHER", title: "Autre wallet" },
  ], []);

  // Charger les données pour l'update
  useEffect(() => {
    const fetchPaymentAccount = async () => {
      if (type === "update" && id) {
        try {
          setLoading(true);
          const response = await fetch(`/api/user/payment-account/${id}`);
          if (!response.ok) throw new Error('Failed to fetch payment account');
          
          const data = await response.json();
          
          // Pré-remplir le formulaire
          setValue('type', data.type);
          setValue('account_identifier', data.account_identifier);
          setValue('provider', data.provider);
          setValue('crypto_currency', data.crypto_currency || '');
          setValue('is_default', data.is_default);
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching payment account:', error);
          showError('Failed to load payment account data');
          setLoading(false);
        }
      }
    };

    fetchPaymentAccount();
  }, [type, id, setValue, showError]);

  // Mettre à jour les champs en fonction du type sélectionné
  useEffect(() => {
    const updateFields = async () => {
      setUpdatingFields(true);
      
      // Petit délai pour montrer le feedback visuel
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (selectedType === PaymentMethod.MOBILE) {
        setValue('crypto_currency', '');
        if (!provider || !mobileProviderOptions.find(p => p.id === provider)) {
          setValue('provider', '');
        }
      } else {
        if (!provider || !cryptoProviderOptions.find(p => p.id === provider)) {
          setValue('provider', '');
        }
      }
      
      setUpdatingFields(false);
    };

    updateFields();
  }, [selectedType, provider, setValue, mobileProviderOptions, cryptoProviderOptions]);

  const onSubmit = async (data: PaymentAccountSchemaType) => {
    try {
      let response;
      
      if (type === "create") {
        response = await fetch('/api/payment-account/create', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      } else {
        response = await fetch(`/api/payment-account/update/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || "Operation failed");
      }

      const result = await response.json();
      
      showSuccess(
        type === "create" 
          ? "Compte de paiement créé avec succès !" 
          : "Compte de paiement modifié avec succès !"
      );
      
      reset();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      if (onModalClose) {
        onModalClose();
      }
    } catch (error: any) {
      console.error("Erreur:", error);
      showError(error.message || "Une erreur est survenue");
    }
  };

  if (loading) return <SectionLoadingSpinner/>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-16" noValidate>
      <div className="flex items-center w-full justify-between gap-4 pr-6">
        <h1 className="font-semibold text-lg">
          {type === "create" ? "Ajouter un compte de paiement" : "Modifier le compte de paiement"}
        </h1>
      </div>

      <SelectField
        options={paymentTypeOptions}
        label="Type de compte"
        placeholder="Sélectionnez le type"
        name="type"
        register={register}
        error={errors?.type}
        full
        required
        valueKey="id"
        textKey="title"
      />

      <div className={`transition-opacity duration-200 ${updatingFields ? 'opacity-50' : 'opacity-100'}`}>
        {selectedType === PaymentMethod.CRYPTO && (
          <>
            <SelectField
              options={cryptoCurrencyOptions}
              label="Crypto-monnaie"
              placeholder="Sélectionnez la crypto"
              name="crypto_currency"
              register={register}
              error={errors?.crypto_currency}
              full
              required
              valueKey="id"
              textKey="title"
              disabled={updatingFields}
            />
            
            <SelectField
              options={cryptoProviderOptions}
              label="Wallet crypto"
              placeholder="Sélectionnez le wallet"
              name="provider"
              register={register}
              error={errors?.provider}
              full
              required
              valueKey="id"
              textKey="title"
              disabled={updatingFields}
            />

            <InputField
              id="account_identifier"
              name="account_identifier"
              type="text"
              label="Adresse crypto"
              placeholder="Ex: 0x742d35Cc6634C0532925a3b8..."
              required
              register={register}
              error={errors.account_identifier}
              disabled={updatingFields}
            />
          </>
        )}

        {selectedType === PaymentMethod.MOBILE && (
          <>
            <SelectField
              options={mobileProviderOptions}
              label="Opérateur mobile"
              placeholder="Sélectionnez l'opérateur"
              name="provider"
              register={register}
              error={errors?.provider}
              full
              required
              valueKey="id"
              textKey="title"
              disabled={updatingFields}
            />

            <InputField
              id="account_identifier"
              name="account_identifier"
              type="text"
              label="Numéro de téléphone"
              placeholder="Ex: +2250700000000"
              required
              register={register}
              error={errors.account_identifier}
              disabled={updatingFields}
            />
          </>
        )}
      </div>

      {updatingFields && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
          <span className="ml-2 text-sm text-gray-400">Mise à jour des champs...</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_default"
          {...register('is_default')}
          className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
          disabled={updatingFields}
        />
        <label htmlFor="is_default" className="text-sm text-gray-300">
          Définir comme compte par défaut
        </label>
      </div>

      {errors.is_default && (
        <p className="text-sm text-red-500">{errors.is_default.message}</p>
      )}
      
      <div>
        <SubmitFormButton
          submitting={isSubmitting || updatingFields}
          type={type}
          title={type === "create" ? "Ajouter le compte" : "Modifier le compte"}
          disabled={updatingFields}
        />
      </div>
    </form>
  );
};

export default PaymentMethodForm;
"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from '../../inputs/InputField';
import { useForm } from "react-hook-form";
import { InvestmentSchema } from '@/app/lib/validations/InvestmentShema';
import { AllFormProps } from '@/types';
import { InvestmentPlan, PaymentMethod } from "@prisma/client";
import SelectField from "../../inputs/SelectField";
import SubmitFormButton from "../SubmitFormButton";
import { useToast } from "@/hooks/use-toast";
import LoadingSpiner from "../LoadingSpiner";
import { z } from "zod";
import { formatMonetary, PaymentMethodList } from "@/app/lib/utils";
import { WithdrawalSchema, WithdrawalSchemaType } from "@/app/lib/validations/WithdrawalSchema";
import { ApiPaymentAccount, WalletResponse } from "@/app/(dashboards)/dashboard/withdrawals/page";

interface PlanFormProps extends AllFormProps {
  onModalClose?: () => void;
  onSuccess?: (data?: any) => void;
  user_id: string;
  wallet: WalletResponse;
  paymentAccounts: ApiPaymentAccount[];
}

interface ApiInvestmentPlan extends Omit<InvestmentPlan, 'id' | 'min_amount' | 'max_amount'> {
  id: string;
  min_amount: string;
  max_amount: string | null;
}

const WithdrawalForm = ({ 
  type,
  id, 
  user_id,  
  wallet, 
  paymentAccounts, 
  onSuccess, 
  onModalClose 
}: PlanFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    watch,
    trigger,
    clearErrors,
  } = useForm({
    resolver: zodResolver(WithdrawalSchema),
    defaultValues: {
      user_id,
      wallet_id: wallet.id,
      payment_account_id: "",
      amount: '',
      status: undefined,
    },
  });

  const { showSuccess, showError } = useToast();
  const [isReloading, setIsReloading] = useState(false);

  const mergedPaymentMethod = useMemo(() => {
    return paymentAccounts.map(method => ({
      id: method.id,
      title: `${method.provider} - ${method.account_identifier}`,
    }));
  }, [paymentAccounts]);

  const validateAmount = useCallback(
    (value: string) => {
      if (!value) return "Le montant est requis";
      const numValue = Number(value);
      if (isNaN(numValue)) return "Doit être un nombre";
      if (numValue <= 0) return "Le montant doit être positif";
      if (numValue > Number(wallet.balance)) return `Le montant ne peut pas dépasser le solde disponible (${formatMonetary(wallet.balance)}$)`;
      return true;
    },
    [wallet.balance]
  );

  const handleFormSuccess = useCallback(() => {
    // Afficher le message de succès
    showSuccess("Retrait créé avec succès !");
    
    // Réinitialiser le formulaire
    reset();
    
    // Appeler les callbacks optionnels
    if (onSuccess) onSuccess();
    if (onModalClose) onModalClose();
    
    // Actualiser la page après un court délai pour que l'utilisateur voie le message
    setIsReloading(true);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }, [showSuccess, reset, onSuccess, onModalClose]);

  const onSubmit = async (data: WithdrawalSchemaType) => {
    try {
      // Conversion et validation du montant
      const amountValue = typeof data.amount === 'string' ? Number(data.amount) : data.amount;
      
      if (isNaN(amountValue)) {
        showError("Montant invalide");
        return;
      }

      if (amountValue <= 0) {
        showError("Le montant doit être positif");
        return;
      }

      if (amountValue > Number(wallet.balance)) {
        showError(`Le montant ne peut pas dépasser ${formatMonetary(wallet.balance)}$`);
        return;
      }

      const validationResult = validateAmount(amountValue.toString());
      if (typeof validationResult === "string") {
        showError(validationResult);
        return;
      }

      const payload = {
        ...data,
        amount: amountValue,
        user_id,
        wallet_id: wallet.id,
      };

      const response = await fetch("/api/withdrawal/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create withdrawal");

      // Utiliser la fonction de succès centralisée
      handleFormSuccess();
      
    } catch (error: any) {
      console.error("Error:", error);
      showError(error.message || "Erreur lors de la soumission");
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h3 className="text-lg font-bold mb-4">Nouveau retrait</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-16" noValidate>
        <h1 className="font-semibold text-lg">
          {type === "create" ? "Nouvel investissement" : "Modifier votre investissement"}
        </h1>
        
        <SelectField
          options={mergedPaymentMethod}
          label="Méthode de retrait"
          placeholder="Sélectionnez une méthode de paiement"
          name="payment_account_id"
          register={register}
          error={errors.payment_account_id}
          valueKey="id"
          textKey="title"
          required
          full
        />

        <InputField
          id="amount"
          name="amount"
          type="number"
          label={`Montant $ (Solde disponible: ${formatMonetary(wallet.balance)}$)`}
          placeholder="Ex: 100"
          required
          register={register}
          error={errors.amount}
          min={0}
          step="0.01"
          onChange={(e) => {
            const value = e.target.value;
            setValue("amount", value, { shouldValidate: true });
            trigger("amount");
          }}
        />

        <div className="flex items-center gap-3">
          <SubmitFormButton
            submitting={isSubmitting || isReloading}
            type={type}
            title={isReloading ? "Actualisation..." : "Soumettre"}
          />
          {(isSubmitting || isReloading) && (
            <span className="text-sm text-blue-400">
              {isReloading ? "Actualisation de la page..." : "Traitement en cours..."}
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default WithdrawalForm;
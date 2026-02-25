"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from '../../inputs/InputField';
import { useForm } from "react-hook-form";
import { InvestmentSchema } from '@/app/lib/validations/InvestmentShema';
import { AllFormProps } from '@/types';
import { InvestmentPlan, WalletType } from "@prisma/client";
import SelectField from "../../inputs/SelectField";
import SubmitFormButton from "../SubmitFormButton";
import { useToast } from "@/hooks/use-toast";
import LoadingSpiner from "../LoadingSpiner";
import { formatMonetary, getTransactionTypeTranslation } from "@/app/lib/utils";
import SectionLoadingSpinner from "../SectionLoadingSpinner";

interface PlanFormProps extends AllFormProps {
  onModalClose?: () => void;
  onSuccess?: (data?: any) => void;
  user_id: string;
  wallets: {
    id: string;
    balance: string;
    type: WalletType;
  }[];
}

interface ApiInvestmentPlan extends Omit<InvestmentPlan, 'id' | 'min_amount' | 'max_amount' | 'daily_profit_percent'> {
  id: string;
  min_amount: string;
  max_amount: string | null;
  daily_profit_percent: string;
}

interface ApiWallet {
  id: string;
  user_id: string;
  balance: string;
  locked_balance: string;
  type: WalletType;
}

const InvestmentForm = ({ type, id, user_id, wallets, onSuccess, onModalClose }: PlanFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    watch,
    trigger,
  } = useForm({
    resolver: zodResolver(InvestmentSchema),
    defaultValues: {
      user_id,
      wallet_id: "",
      plan_id: "",
      amount: '',
    },
  });

  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [investmentPlans, setInvestmentPlans] = useState<ApiInvestmentPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedMinMax, setSelectedMinMax] = useState<string | null>(null);

  const plan_id = watch('plan_id');
  const amount = watch('amount');
  const wallet_id = watch('wallet_id');

  const selectedPlan = useMemo(() => {
    if (!plan_id) return null;
    return investmentPlans.find(plan => plan.id === plan_id) || null;
  }, [plan_id, investmentPlans]);

  const selectedWallet = useMemo(() => {
    if (!wallet_id) return null;
    return wallets.find(wallet => wallet.id === wallet_id) || null;
  }, [wallet_id, wallets]);

  const validateAmount = useCallback((value: string) => {
    if (!value) return "Le montant est requis";
    const numValue = Number(value);
    if (isNaN(numValue)) return "Doit être un nombre";

    if (!selectedPlan) {
      return "Veuillez sélectionner un plan d'investissement";
    }

    if (!selectedWallet) {
      return "Veuillez sélectionner un wallet";
    }

    const min = Number(selectedPlan.min_amount);
    const max = selectedPlan.max_amount ? Number(selectedPlan.max_amount) : Infinity;

    // Réinitialiser le message d'erreur
    setSelectedMinMax(null);

    if (numValue < min) {
      setSelectedMinMax(`Le montant minimum de ce plan est ${formatMonetary(min.toString())}$`);
      return `Le montant minimum de ce plan est ${formatMonetary(min.toString())}$`;
    }
    if (numValue > max) {
      setSelectedMinMax(`Le montantde ce plan  maximum est ${formatMonetary(max.toString())}$`);
      return `Le montant de ce plan  maximum est ${formatMonetary(max.toString())}$`;
    }

    // Vérifier le solde du wallet sélectionné
    const walletBalance = Number(selectedWallet.balance);
    if (numValue > walletBalance) {
      return `Solde insuffisant dans le wallet sélectionné (${formatMonetary(walletBalance.toString())}$)`;
    }

    return true;
  }, [selectedPlan, selectedWallet]);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/investment-plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setInvestmentPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      showError('Failed to load investment plans');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const mergedPlans = useMemo(() => {
    return investmentPlans.map(plan => ({
      id: plan.id,
      title: `${plan.name} min: ${plan.min_amount}$ - max: ${plan.max_amount}$ - ${plan.daily_profit_percent}%/jour - ${plan.duration_days} jours`,
      min_amount: plan.min_amount,
      max_amount: plan.max_amount,
    }));
  }, [investmentPlans]);

  const mergedWallets = useMemo(() => {
    // S'assurer que wallets est un tableau
    const safeWallets = Array.isArray(wallets) ? wallets : [];
    
    return safeWallets.map(wallet => {
      let typeText = '';
      switch (wallet.type) {
        case 'DEPOSIT':
          typeText = 'Wallet principal';
          break;
        case 'PROFIT':
          typeText = 'Wallet Profit';
          break;
        case 'BONUS':
          typeText = 'Wallet Bonus';
          break;
        default:
          typeText = wallet.type;
      }
      
      return {
        id: wallet.id,
        title: `${typeText} - Solde: ${formatMonetary(wallet.balance.toString())}$`,
        balance: wallet.balance,
        type: wallet.type
      };
    });
  }, [wallets]);

  const onSubmit = async (data: any) => {
    try {
      const validationResult = validateAmount(data.amount);
      if (typeof validationResult === 'string') {
        showError(validationResult);
        return;
      }

      const response = await fetch(`/api/user/investment/create/${user_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_id: data.wallet_id,
          plan_id: data.plan_id,
          amount: data.amount,
        }),
      });

      // Vérifier si la réponse est vide
      const responseText = await response.text();
      let result;
      
      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error('Invalid response from server');
        }
      } else {
        throw new Error('Empty response from server');
      }
      
      if (!response.ok) {
        throw new Error(result.error || result.details || "Échec de la création de l'investissement");
      }

      showSuccess("Investissement créé avec succès !");
      reset();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      if (onModalClose) {
        onModalClose();
      }
    } catch (error: any) {
      console.error("Erreur:", error);
      showError(error.message || "Une erreur est survenue lors de la création de l'investissement");
    }
  };

  if (loading) return <LoadingSpiner position="center"/>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-16" noValidate>
      <div className="flex items-center w-full justify-between gap-4 pr-6">
        <h1 className="font-semibold text-lg">
          Nouvel investissement
        </h1>
        {selectedWallet && (
          <h1 className="font-semibold text-lg">
            Solde {getTransactionTypeTranslation(selectedWallet.type)} : {formatMonetary(selectedWallet.balance.toString())}$             
          </h1>
        )}
      </div>

      <SelectField
        options={mergedWallets}
        label="Wallet source" 
        placeholder="Sélectionnez un wallet"
        name="wallet_id"
        register={register}
        error={errors?.wallet_id}
        full
        required
        valueKey="id"
        textKey="title"
        onChange={(e) => {
          setValue('wallet_id', e.target.value, { shouldValidate: true });
          trigger('amount');
        }}
      />
      
      <SelectField
        options={mergedPlans}
        label="Plan d'investissement"
        placeholder="Sélectionnez un plan"
        name="plan_id"
        register={register}
        error={errors?.plan_id}
        full
        required
        valueKey="id"
        textKey="title"
        onChange={(e) => {
          setSelectedPlanId(e.target.value);
          setSelectedMinMax(null);
          trigger('amount');
        }}
      />

      <div className="flex flex-col gap-4">
        <InputField
          id="amount"
          name="amount"
          type="number"
          label="Montant à investir"
          placeholder={selectedPlan ? `Ex: ${selectedPlan.min_amount}` : "Selectionner un plan"}
          required
          register={register}
          error={errors.amount}
          min={selectedPlan ? selectedPlan.min_amount : undefined}
          max={selectedPlan && selectedPlan.max_amount ? selectedPlan.max_amount : undefined}
          step="0.01"
          onChange={(e) => {
            const value = e.target.value;
            setValue('amount', value, { shouldValidate: true });
            trigger('amount');
          }}
        />
        {selectedMinMax && <p className="text-sm text-red-500">{selectedMinMax}</p>}
      </div>

      {selectedPlan && (
        <div className="text-sm text-gray-400 space-y-1">
          <h4>Profit quotidien: {Number(selectedPlan.daily_profit_percent).toFixed(2)}%</h4>
          <h4>Durée: {selectedPlan.duration_days} jours</h4>
          <h4>Plage: {formatMonetary(selectedPlan.min_amount)}$ - {selectedPlan.max_amount ? formatMonetary(selectedPlan.max_amount) + '$' : 'Illimité'}</h4>
          <h4> Profit total estimé: { amount && <span className="text-green-500 font-medium"> {formatMonetary((Number(amount) * Number(selectedPlan.daily_profit_percent) * selectedPlan.duration_days / 100).toFixed(2))}$</span>}</h4>
        
        </div>
      )}

      {selectedWallet && (
        <div className="text-sm text-gray-400">
          <p>Wallet sélectionné: {selectedWallet.type === 'DEPOSIT' ? 'Compte de Dépot' : 'Compte de Profit'}</p>
          <p>Solde disponible: {formatMonetary(selectedWallet.balance.toString())}$</p>
        </div>
      )}
      
      <div>
        <SubmitFormButton
          submitting={isSubmitting}
          type={type}
          title="Investir"
          disabled={!selectedPlan || !selectedWallet || mergedWallets.length === 0}
        />
      </div>
    </form>
  );
};

export default InvestmentForm;
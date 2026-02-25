"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from '../../inputs/InputField';
import SelectField from "../../inputs/SelectField";
import TextAreaField from "../../inputs/TextAreaField";
import { InvestmentPlanSchema, InvestmentPlanSchemaType } from '@/app/lib/validations/InvestmentShema';
import { AllFormProps } from '@/types';
import SubmitFormButton from "../SubmitFormButton";
import { useToast } from "@/hooks/use-toast";

interface PlanFormProps extends AllFormProps {
  onModalClose?: () => void;
  onSuccess?: (data?: any) => void;
}

const PlanForm = ({ type, id, onSuccess, onModalClose }: PlanFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<InvestmentPlanSchemaType>({
    resolver: zodResolver(InvestmentPlanSchema),
    defaultValues: {
      name: "",
      min_amount: 0.00,
      max_amount: undefined,
      daily_profit_percent: 0.00,
      duration_days: 1,
      withdrawal_lock_days: 0,
      description: "",
      is_active: "true",
      capital_return: "true",
    },
  });

  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (type === "update" && id && !hasLoaded) {
      const fetchPlan = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/investment-plans/${id}`);
          if (!response.ok) throw new Error('Failed to fetch plan');
          
          const result = await response.json();
          if (result.success && result.data) {
            const plan = result.data;
            setValue("name", plan.name);
            setValue("min_amount", parseFloat(plan.min_amount));
            setValue("max_amount", plan.max_amount ? parseFloat(plan.max_amount) : undefined);
            setValue("daily_profit_percent", parseFloat(plan.daily_profit_percent));
            setValue("duration_days", plan.duration_days);
            setValue("withdrawal_lock_days", plan.withdrawal_lock_days);
            setValue("description", plan.description || "");
            setValue("is_active", plan.is_active ? "true" : "false");
            setValue("capital_return", plan.capital_return ? "true" : "false");
            setHasLoaded(true);
          } else {
            throw new Error(result.error || "Failed to load plan data");
          }
        } catch (error) {
          console.error("Error loading plan:", error);
          showError("Erreur lors du chargement des données du plan");
        } finally {
          setLoading(false);
        }
      };

      fetchPlan();
    }
  }, [type, id, setValue, showError, hasLoaded]);

  const onSubmit = async (formData: InvestmentPlanSchemaType) => {
    try {
      const payload = type === "update" && id ? { id, ...formData } : formData;
      const response = await fetch(
        type === "update" && id
          ? `/api/investment-plans/update`
          : "/api/investment-plans/create",
        {
          method: type === "update" ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save plan");

      showSuccess(`Plan ${type === "update" ? "mis à jour" : "créé"} avec succès !`);
      reset();
      if (onSuccess) onSuccess();
      if (onModalClose) onModalClose();
    } catch (error: any) {
      console.error("Error:", error);
      showError(error.message || "Erreur lors de la soumission");
    }
  };

  const capitalReturnOptions = [
    { id: "true", title: "Oui" },
    { id: "false", title: "Non" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-16" noValidate>
      <h1 className="font-semibold text-lg">
        {type === "create" ? "Nouveau plan" : "Modifier votre plan"}
      </h1>

      {loading && <p>Chargement des données...</p>}

      <div>
        <InputField
          id="name"
          name="name"
          type="text"
          label="Nom du plan"
          placeholder="Ex: Starter"
          required
          register={register}
          error={errors.name}
        />
      </div>

      <div>
        <InputField
          id="min_amount"
          name="min_amount"
          type="number"
          label="Montant minimum"
          placeholder="Ex: 100.00"
          required
          register={register}
          error={errors.min_amount}
          min="0"
          step="0.01"
        />
      </div>

      <div>
        <InputField
          id="max_amount"
          name="max_amount"
          type="number"
          label="Montant maximum"
          placeholder="Ex: 10000.00"
          register={register}
          error={errors.max_amount}
          min="0"
          step="0.01"
        />
      </div>

      <div>
        <InputField
          id="daily_profit_percent"
          name="daily_profit_percent"
          type="number"
          label="Pourcentage de profit quotidien"
          placeholder="Ex: 1.50"
          required
          register={register}
          error={errors.daily_profit_percent}
          min="0"
          step="0.01"
        />
      </div>

      <div>
        <InputField
          id="duration_days"
          name="duration_days"
          type="number"
          label="Durée (jours)"
          placeholder="Ex: 30"
          required
          register={register}
          error={errors.duration_days}
          min="1"
        />
      </div>

      <div>
        <InputField
          id="withdrawal_lock_days"
          name="withdrawal_lock_days"
          type="number"
          label="Jours de verrouillage des retraits"
          placeholder="Ex: 15"
          required
          register={register}
          error={errors.withdrawal_lock_days}
          min="0"
        />
      </div>

      <div>
        <SelectField
          id="capital_return"
          name="capital_return"
          label="Retour du capital"
          options={capitalReturnOptions}
          required
          register={register}
          error={errors.capital_return}
          valueKey="id"
          textKey="title"
        />
      </div>

      <div>
        <SelectField
          id="is_active"
          name="is_active"
          label="Plan actif"
          options={capitalReturnOptions}
          required
          register={register}
          error={errors.is_active}
          valueKey="id"
          textKey="title"
        />
      </div>

      <div>
        <TextAreaField
          id="description"
          name="description"
          label="Description"
          placeholder="Entrez une description du plan..."
          register={register}
          error={errors.description}
        />
      </div>

      <div>
        <SubmitFormButton submitting={isSubmitting} type={type} title="Soumettre" />
      </div>
    </form>
  );
};

export default PlanForm;
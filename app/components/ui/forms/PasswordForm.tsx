
"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from '../../inputs/InputField'
import { PasswordSchema, PasswordSchemaType } from '@/app/lib/validations/PasswordSchema';
import { AllFormProps } from '@/types';
import { InvestmentPlan } from "@prisma/client";
import SelectField from "../../inputs/SelectField";
import SubmitFormButton from "../SubmitFormButton";
import { DocumentTypeList } from "@/app/lib/utils";
import InputPassword from "../../inputs/InputPasword";

interface FormProps {
  id: string;
  onSuccess?: () => void;
}

const PasswordForm = ({ id, onSuccess }: FormProps) => {

const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<PasswordSchemaType>({
    resolver: zodResolver(PasswordSchema),
  });

  const [actionState, setActionState] = useState<{
    success: boolean;
    error: string | null;
  }>({
    success: false,
    error: null,
  });

  const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (formData: PasswordSchemaType) => {
    try {
    console.log(formData)
    } catch (error: any) {
      // console.error("Erreur lors de la soumission:", error);
      // const errorMessage = error.message || 
      //   (type === "update" 
      //     ? "Échec de la mise à jour" 
      //     : "Échec de la création");
      // toast.error(errorMessage);
      setActionState({ success: false, error: 'errorMessage' });
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-16" noValidate>
<h1 className="font-semibold text-lg">
       Modifier votre mot de passe
      </h1>

    
      <InputPassword
              id="password"
              name="password"
              label="Mot de passe"
              autoComplete="new-password"
              required
              register={register}
              error={errors.password}
            />

 <InputPassword
              id="confirm-password"
              name="confirm-password"
              label="Confirmer le mot de passe"
              autoComplete="current-password"
              required
              register={register}
              error={errors.password}
              disclaimer
            />
      <SubmitFormButton submitting={submitting} type="update"  />

    </form>
  )
}

export default PasswordForm
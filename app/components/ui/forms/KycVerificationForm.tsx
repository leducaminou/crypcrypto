"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../../inputs/InputField";

import SelectField from "../../inputs/SelectField";
import { countryList, DocumentTypeList } from "@/app/lib/utils";

import InputFile from "../../inputs/InputFile";
import {
  KycVerificationSchemaSchema,
  KycVerificationSchemaSchemaType,
} from "@/app/lib/validations/KycVerificationSchema";
import SubmitFormButton from "../SubmitFormButton";

interface FormProps {
  id: string;
  type: "create" | "update";
}
const KycVerificationForm = ({ id, type="create" }: FormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<KycVerificationSchemaSchemaType>({
    resolver: zodResolver(KycVerificationSchemaSchema),
  });

  const [actionState, setActionState] = useState<{
    success: boolean;
    error: string | null;
  }>({
    success: false,
    error: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const onSubmit = async (formData: KycVerificationSchemaSchemaType) => {
    try {
      console.log(formData);
    } catch (error: any) {
      // console.error("Erreur lors de la soumission:", error);
      // const errorMessage = error.message ||
      //   (type === "update"
      //     ? "Échec de la mise à jour"
      //     : "Échec de la création");
      // toast.error(errorMessage);
      setActionState({ success: false, error: "errorMessage" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full flex flex-col gap-4 pb-16"
      noValidate
    >
      <SelectField
        options={DocumentTypeList}
        label="Type de document"
        name="document_type"
        register={register}
        error={errors?.document_type}
        required
      />

      <div className="flex flex-col gap-8 ">
        <InputField
          id="document_number"
          name="document_number"
          type="number"
          label="Numéro du document"
          placeholder="Ex: 5000"
          required
          register={register}
          error={errors.document_number}
        />

        <InputFile
          label="Recto du document"
          name="front_img"
          register={register}
          error={errors.document_front_url}
          fileTypes=".jpg, .jpeg, .png"
          required
        />
        <InputFile
          label="Recto du document"
          name="back_img"
          register={register}
          error={errors.document_back_url}
          fileTypes=".jpg, .jpeg, .png"
          required
        />

        <div className="w-full flex flex-col gap-2">
          <InputFile
            label="Selfie avec le document"
            name="back_img"
            register={register}
            error={errors.document_back_url}
            fileTypes=".jpg, .jpeg, .png"
            required
          />
          <h6 className="text-sm  underline text-yellow-500">
            Une photo de vous où on voit votre visage et le recto de votre document
          </h6>
        </div>
      </div>
    <div>
      <SubmitFormButton submitting={submitting} type={type} title="Enregistrer" />
    </div>
    </form>
  );
};

export default KycVerificationForm;

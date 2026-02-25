"use client";

import Image from "next/image";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "@/app/components/inputs/InputField";
import Link from "next/link";
import {
  ForgotPasswordSchema,
  ForgotPasswordSchemaType,
} from "@/app/lib/validations/AuthSchema";
import { CircleAlert } from "lucide-react";

const ForgotPasswordPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchemaType>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordSchemaType) => {
    console.log("Form submitted:", data);
    // TODO: Implement API call to send password reset email
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="JuaTradX Logo"
            width={80}
            height={80}
            className="rounded-lg"
            priority
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Réinitialisation du mot de passe
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Entrez votre email pour recevoir les instructions de réinitialisation
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
           
              <InputField
                  id="email"
                  name="email"
                  type="email"
                  label="Adresse email"
                  autoComplete="email"
                  required
                  register={register}
                  error={errors.email}
                  placeholder="votre@email.com"
                />

            <div className="rounded-md bg-gray-700 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  
                  <CircleAlert className="h-5 w-5 text-indigo-400"/>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-indigo-300">
                    Instructions importantes
                  </h3>
                  <div className="mt-2 text-sm text-gray-400">
                    <p>
                      Un lien de réinitialisation vous sera envoyé par email. Ce lien expirera dans 24 heures.
                    </p>
                  </div>
                </div>
              </div>
            </div>


            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium
                 text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Envoyer les instructions
              </button>
            </div>

            
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">
                  Retour à la
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="font-medium text-indigo-400 hover:text-indigo-300"
              >
                page de connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
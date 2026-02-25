// app/(auth)/login/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginSchemaType } from "@/app/lib/validations/AuthSchema";
import InputField from "@/app/components/inputs/InputField";
import InputPassword from "@/app/components/inputs/InputPasword";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Roles } from "@/app/lib/auth.config";
import ButtonLink from "@/app/components/ui/ButtonLink";
import Button from "@/app/components/ui/Button";

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  // Redirection uniquement après une connexion réussie
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const callbackUrl = searchParams.get("callbackUrl");
      
      if (callbackUrl) {
        router.push(callbackUrl);
        return;
      }

      // Redirection par défaut selon le rôle
      if (session.user.role === Roles.ADMIN) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [status, session, router, searchParams]);

  const onSubmit = async (data: LoginSchemaType) => {
    if (loading) return;
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        identifier: data.identifier,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (result?.error) {
        toast.error(result.error || "Échec de la connexion");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        toast.success("Connexion réussie");
        // La redirection sera gérée par le useEffect ci-dessus
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Une erreur est survenue lors de la connexion");
      setLoading(false);
    }
  };

  // Si déjà authentifié, afficher un message de redirection
  if (status === "authenticated") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8 h-screen">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Connexion à votre compte
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Accédez à votre espace d'investissements financier
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <InputField
              id="identifier"
              name="identifier"
              type="text"
              label="Email ou téléphone"
              autoComplete="username"
              required
              register={register}
              error={errors.identifier}
            />

            <InputPassword
              id="password"
              name="password"
              label="Mot de passe"
              autoComplete="current-password"
              required
              register={register}
              error={errors.password}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  {...register("rememberMe")}
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded bg-gray-700"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-300"
                >
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-indigo-400 hover:text-indigo-300"
                >
                  Mot de passe oublié?
                </Link>
              </div>
            </div>

            <div>
              <Button
                variant="primary"
                type="submit"
                className="text-white"
                fullWidth
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </div>
          </form>
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">
                  Vous n'avez de compte?
                </span>
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <ButtonLink
                href="/register"
                variant="secondary"
                className="text-white"
                fullWidth
              >
                S'inscrire
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
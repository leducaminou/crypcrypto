"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

const UnauthorizedPage = () => {
  // Fonction pour déconnecter l'utilisateur
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image
            src="/images/logo/logo.png"
            alt="JuaTradX Logo"
            width={80}
            height={80}
            className="rounded-lg"
            priority
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Accès non autorisé
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Vous n'avez pas les permissions nécessaires pour accéder à cette
          ressource
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-medium text-red-400">
              Erreur 403 - Accès refusé
            </h3>
            <div className="mt-4 text-sm text-gray-400">
              <p>
                Vous essayez d'accéder à une page ou une fonctionnalité réservée
                aux utilisateurs avec les permissions appropriées.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Se connecter avec un autre compte
            </Link>

            <Link
              href="/"
              className="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Retour à l'accueil
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Se déconnecter
            </button>

            <div className="text-sm mt-4">
              <Link
                href="/contact"
                className="font-medium text-indigo-400 hover:text-indigo-300"
              >
                Contacter le support technique
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;

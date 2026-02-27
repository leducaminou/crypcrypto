// app/(dashboards)/layout.tsx
"use client";

import DashboardHeader from "@/app/components/ui/dashboard/Header";
import Sidebar from "@/app/components/ui/dashboard/Sidebar";
import ClientWrapper from "@/app/components/wrapper/ClientWrapper";
import { SessionProvider } from "next-auth/react";
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import PageLoadingSpiner from "../components/ui/PageLoadingSpiner";
import { ThemeProvider } from "next-themes";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (!session) return <PageLoadingSpiner />;

  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        enableSystem={true}
        defaultTheme="system"
      >
        <div className="flex min-h-screen bg-gray-900 relative overflow-hidden">
          {/* Sidebar fixée à gauche */}
          <div className="fixed top-0 left-0 z-40 h-screen bg-gray-800 border-r border-gray-700">
            <Sidebar role={session.user.role} />
          </div>

          {/* Contenu principal avec marge pour la sidebar */}
          <div className="flex flex-col flex-1 md:ml-64 min-h-screen relative z-10">
            {/* Header fixe en haut */}
            <div className="fixed top-0 right-0 left-0 md:left-64 z-30">
              <DashboardHeader />
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 mt-16">
              <ClientWrapper
                userId={session.user.id}
                className="w-full min-h-full p-4 md:p-8"
              >
                {children}
              </ClientWrapper>
            </div>
          </div>
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
}

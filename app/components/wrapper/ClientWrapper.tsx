'use client';

import React, { createContext, useContext } from "react";

const IdContext = createContext<string | null>(null);

interface ClientWrapperProps {
  children: React.ReactNode;
  className: string;
  userId: string;
  user?: string;
}

export default function ClientWrapper({ children, className, userId }: ClientWrapperProps) {
  return (
    <IdContext.Provider value={userId}>
      <main className={className}>
        {children}
      </main>
    </IdContext.Provider>
  );
}

// Hook pour utiliser l'ID dans les enfants
export function useIdContext() {
  const userId = useContext(IdContext);
  if (userId === null) {
    throw new Error("useIdContext must be used within a ClientWrapper");
  }
  return userId;
}
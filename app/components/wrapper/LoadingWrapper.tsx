'use client';

import { useLoading } from '@/app/context/LoadingContext';
import { useEffect } from 'react';

export default function LoadingWrapper({ children }: { children: React.ReactNode }) {
  const { stopLoading } = useLoading();

  useEffect(() => {
    stopLoading(); // Arrête le chargement quand le composant est monté
  }, [stopLoading]);

  return <>{children}</>;
}
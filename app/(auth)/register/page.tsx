import RegisterClient from './RegisterClient';
import { Suspense } from 'react';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <RegisterClient />
    </Suspense>
  );
}
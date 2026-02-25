'use client'
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Roles } from '@/app/lib/auth.config';

interface ProtectedRouteProps {
  allowedRoles: Roles[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false); // Éviter les redirections multiples

  useEffect(() => {
    if (hasRedirected) return; // Empêcher les redirections répétées
    if (status === 'loading') {
      console.log('ProtectedRoute - Chargement de la session...');
      return;
    }

    const checkSession = async () => {
      const currentSession = await getSession();
      console.log('ProtectedRoute - Session actuelle:', currentSession);

      if (!currentSession) {
        console.log('ProtectedRoute - Non authentifié, redirection vers /login');
        setHasRedirected(true);
        router.push('/login');
        return;
      }

      const userRole = currentSession.user?.role;
      if (!userRole) {
        console.log('ProtectedRoute - Rôle non trouvé dans la session');
        setHasRedirected(true);
        router.push('/unauthorized');
        return;
      }

      if (!allowedRoles.includes(userRole)) {
        console.log('ProtectedRoute - Accès non autorisé, rôle:', userRole, 'Rôles autorisés:', allowedRoles);
        setHasRedirected(true);
        router.push('/unauthorized');
        return;
      }

      console.log('ProtectedRoute - Accès autorisé, rôle:', userRole);
    };

    checkSession();
  }, [session, status, router, allowedRoles, hasRedirected]);

  if (status === 'loading') {
    return <div>Chargement...</div>;
  }

  if (!session || !allowedRoles.includes(session.user?.role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
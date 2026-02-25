'use client';

import { Menu, LogOut, User, Settings } from 'lucide-react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import NotificationBell from '../NotificationBell';
import { AdminUserWithStats, UserResponse } from '@/types';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardHeader() {
  const { data: session } = useSession();
  const router = useRouter();

  const [user, setUser] = useState<AdminUserWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserResponse | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user basic info
        const userResponse = await fetch(`/api/admin/users?user_id=${userId}`);
        if (!userResponse.ok) throw new Error('Failed to fetch user');
        const userData = await userResponse.json();
        setUser(userData.users.find((u: AdminUserWithStats) => u.id === userId) || null);

        // Fetch detailed user info
        const userDetailsResponse = await fetch(`/api/user/${userId}`);
        if (!userDetailsResponse.ok) throw new Error('Failed to fetch user details');
        const userDetailsData = await userDetailsResponse.json();
        setUserDetails(userDetailsData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut({ 
        redirect: true,
        callbackUrl: '/auth/signin'
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleProfileNavigation = () => {
    router.push('/profile');
    setIsProfileDropdownOpen(false);
  };



  const displayName = user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}`
    : 'Utilisateur';

  return (
    <div className="bg-gray-800 border-b border-gray-700 fixed top-0 left-0 right-0 z-10 text-white">
      <div className="flex justify-between items-center p-4 max-w-full">
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          <h2 className="text-lg font-semibold truncate">Tableau de bord</h2>
        </div>
        <div className="flex items-center space-x-4 flex-shrink-0">
          {/* Composant de notifications */}
          {session && (
            <NotificationBell 
              userId={session.user.id} 
              userRole={session.user.role} 
            />
          )}
          
          {/* Dropdown du profil */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleProfileClick}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              <Image
                src="/avatar.png"
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full flex-shrink-0 border border-gray-600"
              />
              <span className="text-sm truncate max-w-32 hidden sm:block">
                {displayName}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 top-12 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                {/* En-tête du profil */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Image
                      src="/avatar.png"
                      alt="Profile"
                      width={40}
                      height={40}
                      className="rounded-full border border-gray-600"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {session?.user?.email}
                      </p>
                      <p className="text-xs text-cyan-400 capitalize">
                        {session?.user?.role?.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-2">
                  <button
                    onClick={handleProfileNavigation}
                    className="flex items-center space-x-3 w-full p-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-150"
                  >
                    <User className="w-4 h-4" />
                    <span>Mon Profil</span>
                  </button>

              
                </div>

                {/* Séparateur */}
                <div className="border-t border-gray-700"></div>

                {/* Déconnexion */}
                <div className="p-2">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-3 w-full p-2 text-sm text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-md transition-colors duration-150"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
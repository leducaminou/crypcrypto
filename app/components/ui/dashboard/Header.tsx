"use client";

import { Menu, LogOut, User, Settings } from "lucide-react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import NotificationBell from "../NotificationBell";
import { AdminUserWithStats, UserResponse } from "@/types";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

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
        if (!userResponse.ok) throw new Error("Failed to fetch user");
        const userData = await userResponse.json();
        setUser(
          userData.users.find((u: AdminUserWithStats) => u.id === userId) ||
            null,
        );

        // Fetch detailed user info
        const userDetailsResponse = await fetch(`/api/user/${userId}`);
        if (!userDetailsResponse.ok)
          throw new Error("Failed to fetch user details");
        const userDetailsData = await userDetailsResponse.json();
        setUserDetails(userDetailsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut({
        redirect: true,
        callbackUrl: "/auth/signin",
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleProfileNavigation = () => {
    router.push("/profile");
    setIsProfileDropdownOpen(false);
  };

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : "Utilisateur";

  return (
    <div className="bg-gray-800 border-b border-gray-700 fixed top-0 left-0 right-0 z-10 text-white">
      <div className="flex justify-between items-center p-4 max-w-full">
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-indigo-600 truncate uppercase tracking-tight">
            Plateforme de Trading IA
          </h2>
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
              className="flex items-center space-x-3 p-1.5 pr-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 shadow-lg"
            >
              <div className="p-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600">
                <Image
                  src="/avatar.png"
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full flex-shrink-0 border-2 border-gray-800"
                />
              </div>
              <span className="text-sm font-medium truncate max-w-32 hidden sm:block">
                {displayName}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 top-14 w-64 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl">
                {/* En-tête du profil */}
                <div className="p-5 bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600">
                      <Image
                        src="/avatar.png"
                        alt="Profile"
                        width={44}
                        height={44}
                        className="rounded-full border-2 border-gray-800"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {session?.user?.email}
                      </p>
                      <div className="mt-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 uppercase tracking-widest border border-indigo-500/30">
                          {session?.user?.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-2">
                  <button
                    onClick={handleProfileNavigation}
                    className="flex items-center space-x-3 w-full p-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-150"
                  >
                    <div className="p-1.5 rounded-lg bg-white/5">
                      <User className="w-4 h-4" />
                    </div>
                    <span>Mon Profil</span>
                  </button>
                </div>

                {/* Séparateur */}
                <div className="mx-4 border-t border-gray-700"></div>

                {/* Déconnexion */}
                <div className="p-2">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-3 w-full p-2.5 text-sm text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-150"
                  >
                    <div className="p-1.5 rounded-lg bg-red-400/10">
                      <LogOut className="w-4 h-4" />
                    </div>
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

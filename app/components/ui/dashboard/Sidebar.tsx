"use client";
import Link from "next/link";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, House, Menu, X, LogOut } from "lucide-react";
import { ADMIN_ROLE } from "@/app/lib/utils";
import { sidebarMenuItems } from "@/app/lib/sidebarMenuItems";
import { signOut } from "next-auth/react";
import Image from "next/image";

// Interface pour les props du composant Sidebar
interface SidebarProps {
  role: string;
}

// Interfaces pour la structure des menus
interface DropdownItem {
  label: string;
  href: string;
}

interface MenuItem {
  name: string;
  href?: string; // Rendons href optionnel
  icon: React.ReactNode;
  visible: string[];
  dropdown?: DropdownItem[];
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(
    {},
  );

  // Fonction pour basculer l'état d'un menu déroulant
  const toggleDropdown = (itemName: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  // Fonction pour basculer la visibilité de la sidebar (mobile)
  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };

  // Fonction pour déconnecter l'utilisateur
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  // Filtrer les éléments visibles selon le rôle
  const filteredNavItems = sidebarMenuItems.filter((item) =>
    item.visible.includes(role),
  );

  return (
    <>
      {/* Bouton pour mobile */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-full shadow-md"
      >
        {isSidebarVisible ? (
          <X size={24} className="text-cyan-500" />
        ) : (
          <Menu size={24} className="text-cyan-500" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`w-64 bg-gray-800 border-r border-gray-700 h-screen fixed transition-transform lg:translate-x-0 ${isSidebarVisible ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full overflow-y-auto hidden-scrollbar">
          <div>
            <div className="p-6 border-b border-gray-700">
              <Image
                alt="Logo"
                src="/images/logo/logo.png"
                width={140}
                height={140}
                className="mb-2"
              />
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Investissement IA
              </p>
            </div>
            <nav className="p-4">
              <ul className="space-y-2">
                {filteredNavItems.map((item) => (
                  <li key={item.name}>
                    {item.dropdown ? (
                      <>
                        <button
                          onClick={() => toggleDropdown(item.name)}
                          className={`flex items-center justify-between w-full p-3 rounded-xl transition-all duration-200 ${item.href && pathname.startsWith(item.href) ? "bg-indigo-600/20 text-white border border-indigo-500/30" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                        >
                          <div className="flex items-center">
                            <span
                              className={`mr-3 ${item.href && pathname.startsWith(item.href) ? "text-indigo-400" : ""}`}
                            >
                              {item.icon}
                            </span>
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${openDropdowns[item.name] ? "rotate-180" : ""}`}
                          />
                        </button>
                        {openDropdowns[item.name] && (
                          <ul className="ml-9 mt-2 space-y-1 border-l border-gray-700/50">
                            {item.dropdown.map((subItem) => (
                              <li key={subItem.label}>
                                <Link
                                  href={subItem.href}
                                  className={`flex items-center p-2 pl-4 rounded-lg text-sm transition-colors ${pathname === subItem.href ? "text-white font-medium bg-white/10" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                                >
                                  {subItem.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href || "#"}
                        className={`flex items-center p-3 rounded-xl transition-all duration-200 ${pathname === item.href ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                      >
                        <span className="mr-3">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Bouton de déconnexion fixé en bas */}
          <div className="mt-auto p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <span className="mr-3">
                <LogOut size={16} />
              </span>
              <span className="font-medium">Se déconnecter</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

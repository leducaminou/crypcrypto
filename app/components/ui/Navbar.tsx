// components/Navbar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Gestion du scroll pour l'effet de navbar réduite
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fermer le menu mobile quand on change de page
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Liens de navigation
  const navLinks = [
    { name: "Accueil", href: "/" },
    { name: "Investir", href: "/invest" },
    { name: "À propos", href: "/about" },
    { name: "FAQ", href: "/help" },
    { name: "Contact", href: "/contact" },
  ];

  // Vérifie si le lien est actif
  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? "bg-gray-900 bg-opacity-95 backdrop-blur-md py-2 border-b border-gray-800" : "bg-gray-900 bg-opacity-80 backdrop-blur-md py-3"}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/logo/logo.png"
              alt="Jua Trad'X Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              Jua Trad'X
            </span>
          </Link>

          {/* Liens desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`relative py-2 px-1 text-sm font-medium transition-colors ${isActive(link.href) ? "text-cyan-400" : "text-gray-300 hover:text-cyan-400"}`}
              >
                {link.name}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 rounded-full"></span>
                )}
              </Link>
            ))}
          </div>

          {/* Boutons d'action */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 rounded-md border border-cyan-500 text-cyan-400 hover:bg-cyan-900 hover:bg-opacity-30 transition text-sm"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm"
            >
              S'inscrire
            </Link>
          </div>

          {/* Bouton menu mobile */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white focus:outline-none"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Ouvrir le menu</span>
              {!isOpen ? (
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "max-h-screen" : "max-h-0"}`}
      >
        <div className="px-4 pt-2 pb-6 bg-gray-900 border-t border-gray-800">
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`py-2 px-3 rounded-md text-base font-medium ${isActive(link.href) ? "bg-gray-800 text-cyan-400" : "text-gray-300 hover:bg-gray-800"}`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-gray-800 space-y-3">
              <Link
                href="/login"
                className="block w-full px-4 py-2 text-center rounded-md border border-cyan-500 text-cyan-400 hover:bg-cyan-900 hover:bg-opacity-30 transition"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="block w-full px-4 py-2 text-center rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              >
                S'inscrire
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

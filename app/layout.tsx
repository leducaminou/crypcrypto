import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/app/providers/toast-provider";
import AuthSessionProvider from "@/app/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "FiguraNex — Plateforme d'Investissement",
  description:
    "Investissez et faites croître votre argent avec FiguraNex. Dépôts et retraits en USD.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthSessionProvider>
          <ToastProvider />
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}

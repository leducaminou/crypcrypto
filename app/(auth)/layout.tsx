// app/(auth)/layout.tsx
"use client";

import React from "react";
import { ThemeProvider } from "next-themes";
import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";
import ScrollToTop from "../components/ui/ScrollToTop";
import AuthWrapper from "../components/wrapper/AuthWrapper";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      enableSystem={true}
      defaultTheme="system"
    >
      <AuthWrapper>
        <Header />
        <main className="min-h-screen bg-gray-900">
          {children}
        </main>
        <Footer />
        <ScrollToTop />
      </AuthWrapper>
    </ThemeProvider>
  );
}
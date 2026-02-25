
'use client'

import React from "react";


import { ThemeProvider } from "next-themes";

import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";
import ScrollToTop from "../components/ui/ScrollToTop";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {



  return (

        <ThemeProvider
          attribute="class"
          enableSystem={true}
          defaultTheme="system"
        >
          
            <Header />
            {children}
            <Footer />
          <ScrollToTop />
        </ThemeProvider>
  );
}
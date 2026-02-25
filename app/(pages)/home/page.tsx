"use client";
import Companies from "@/app/components/companies/Companies";
import Hero from "@/app/components/Hero/Hero";
import Faq from "@/app/components/work/Faq";
import Features from "@/app/components/work/Features";
import Plans from "@/app/components/work/Plans";
import Simple from "@/app/components/work/Simple";
import Table from "@/app/components/work/Table";
import Trade from "@/app/components/work/Trade";
import Work from "@/app/components/work/Work";
import React, { useState } from "react";

const HomePage = () => {
  const [isOpen, setOpen] = useState(false);

  const openModal = () => {
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
  };

  return (
    <main className="flex flex-col w-full gap-8">
      <Hero />
      <Companies />
      <Work />
      <Table />
      <Features />
      <Plans />
      <Simple />
      <Trade />
      <Faq />
    </main>
  );
};

export default HomePage;

"use client";
import { workdata } from "@/app/lib/data";
import { formatMonetary } from "@/app/lib/utils";
import { InvestmentPlan } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface ApiInvestmentPlan
  extends Omit<
    InvestmentPlan,
    | "id"
    | "name"
    | "description"
    | "min_amount"
    | "max_amount"
    | "daily_profit_percent"
    | "duration_days"
    | "featured"
  > {
  id: string;
  name: string;
  description: string;
  min_amount: string;
  max_amount: string | null;
  daily_profit_percent: string;
  duration_days: string;
  featured: boolean;
}

const Plans = () => {
  const [investmentPlans, setInvestmentPlans] = useState<ApiInvestmentPlan[]>(
    []
  );

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch("/api/investment-plans");
      if (!response.ok) throw new Error("Failed to fetch plans");
      const data = await response.json();
      setInvestmentPlans(data);
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    console.log(investmentPlans);
  }, [investmentPlans]);

  return (
    <section id="plans">
      <div className="py-8 container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4 relative">
        <div className="bg-banner-image hidden lg:block absolute w-full h-full top-1/2 -right-1/4 blur-390"></div>
        <div className="text-center mb-14">
          <h3 className="text-white text-3xl md:text-5xl font-bold mb-3">
            Plans d'investissements
          </h3>
          <p className="text-white/60 md:text-lg font-normal leading-8">
            Commencez dès maintenant à batir votre fortune
          </p>
        </div>
        <div className="w-full flex flex-col lg:flex-row items-center   gap-y-20 gap-x-5 mt-32 h-fit">
          {investmentPlans.map((plan, i) => (
            <div
              className= {` ${plan.featured ? "px-8 py-16" : "p-8"} w-full  h-fit flex flex-col gap-4
              bg-darkmode border border-darkmode 
              group hover:border-primary hover:scale-105 duration-300 rounded-2xl` }
              
              key={i}
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl text-white font-semibold text-center">
                  {plan.name}
                </h3>
                <p className="text-lg text-white/80 text-center mt-2 overflow-hidden line-clamp-3 group-hover:h-auto group-hover:line-clamp-none transition-all duration-300">
                  {plan.description}
                </p>
              </div>
              <hr className="bg-white/60 my-4" />

              <div className="space-y-4">
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Investissement min:</span>
                  <span className="font-medium">{formatMonetary(plan.min_amount) } token</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Investissement max:</span>
                  <span className="font-medium">{ plan.max_amount ? formatMonetary(plan.max_amount)+'$' : "infini"}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Profit quotidien:</span>
                  <span className="font-medium text-cyan-400">
                    {plan.daily_profit_percent}%
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Durée:</span>
                  <span className="font-medium">{plan.duration_days}</span>
                </div>
              </div>
              <Link
                href="/register"
  className={` ${!plan.featured && "opacity-50 hover:opacity-100"} 
     
  bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-center text-white duration-300 px-5 py-4 rounded-lg
  `}
             
              >
                Investir maintenant
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Plans;

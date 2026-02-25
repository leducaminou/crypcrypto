'use client'

import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from "react-hook-form";
import { InvestmentPlan } from '@prisma/client';
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ProfitCalculatorSchema } from '@/app/lib/validations/ProfitCalculatorSchema';
import SelectField from '../inputs/SelectField';
import InputField from '../inputs/InputField';
import { calculateProfit } from '@/app/lib/utils';

interface ApiInvestmentPlan extends Omit<InvestmentPlan, 'id' | 'min_amount' | 'max_amount' | 'daily_profit_percent'> {
    id: string;
    min_amount: string;
    max_amount: string | null;
    daily_profit_percent: string;
}

const ProfitCalculator = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        reset,
        watch,
        trigger,
        clearErrors,
    } = useForm({
        resolver: zodResolver(ProfitCalculatorSchema),
        defaultValues: {
            amount: "0"
        },
    });

    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [investmentPlans, setInvestmentPlans] = useState<ApiInvestmentPlan[]>([]);
    const [profit, setProfit] = useState<number>(0);
    const [dailyProfit, setDailyProfit] = useState<number>(0);
    const [weeklyProfit, setWeeklyProfit] = useState<number>(0);
    const [monthlyProfit, setMonthlyProfit] = useState<number>(0);

    const plan_id = watch('plan_id');
    const amount = watch('amount');

    const mergedPlans = useMemo(() => {
        return investmentPlans.map(plan => ({
            id: plan.id,
            title: `${plan.name} - min: ${plan.min_amount}$ - max: ${plan.max_amount}$ - ${plan.daily_profit_percent}%/jour - ${plan.duration_days} jours`,
            min_amount: plan.min_amount,
            max_amount: plan.max_amount,
            name: plan.name,
            duration_days: plan.duration_days,
            daily_profit_percent: parseFloat(plan.daily_profit_percent),
        }));
    }, [investmentPlans]);

    const selectedPlan = useMemo(() => {
        if (!plan_id) return null;
        return mergedPlans.find(plan => plan.id === plan_id) || null;
    }, [plan_id, mergedPlans]);

    const fetchPlans = useCallback(async () => {
        try {
            const response = await fetch('/api/investment-plans');
            if (!response.ok) throw new Error('Failed to fetch plans');
            const data = await response.json();
            setInvestmentPlans(data);
        } catch (error) {
            console.error('Error fetching plans:', error);
            showError('Failed to load investment plans');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    // Gestionnaire onChange pour le SelectField
    const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setValue('plan_id', e.target.value);
        trigger('plan_id'); // Forcer la validation pour synchroniser les mises à jour
    };

    // Calculer les profits lorsque amount ou plan_id change
    useEffect(() => {
        const amountNum = parseFloat(amount);
        if (
            selectedPlan &&
            !isNaN(amountNum) &&
            amountNum > 0 &&
            selectedPlan.duration_days &&
            !isNaN(selectedPlan.daily_profit_percent)
        ) {
            // Profit total pour la durée du plan
            const totalProfit = calculateProfit(
                amountNum,
                selectedPlan.duration_days,
                selectedPlan.daily_profit_percent
            );
            setProfit(totalProfit);

            // Profit quotidien (1 jour)
            const calculatedDailyProfit = calculateProfit(
                amountNum,
                1,
                selectedPlan.daily_profit_percent
            );
            setDailyProfit(calculatedDailyProfit);

            // Profit hebdomadaire (7 jours)
            const calculatedWeeklyProfit = calculateProfit(
                amountNum,
                7,
                selectedPlan.daily_profit_percent
            );
            setWeeklyProfit(calculatedWeeklyProfit);

            // Profit mensuel (30 jours)
            const calculatedMonthlyProfit = calculateProfit(
                amountNum,
                30,
                selectedPlan.daily_profit_percent
            );
            setMonthlyProfit(calculatedMonthlyProfit);
        } else {
            setProfit(0);
            setDailyProfit(0);
            setWeeklyProfit(0);
            setMonthlyProfit(0);
        }
    }, [amount, plan_id, selectedPlan]);

    return (
        <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-2">Calculateur de profit</h2>
            <p className="text-gray-400 text-center mb-10">Estimez vos gains potentiels</p>
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
                <div className="w-full flex flex-col lg:flex-row items-center gap-6">
                    <div className='w-full lg:w-1/3'>
                        <InputField
                            id="amount"
                            name="amount"
                            type="number"
                            label="Montant d'investissement ($)"
                            placeholder="1000"
                            required
                            height="sm"
                            register={register}
                        />
                    </div>
                    <div className='w-full lg:w-2/3'>
                        <SelectField
                            options={mergedPlans}
                            label="Plan d'investissement"
                            placeholder="Selectionnez un plan d'investissement"
                            name="plan_id"
                            register={register}
                            error={errors?.plan_id}
                            full
                            required
                            height="sm"
                            valueKey="id"
                            textKey="title"
                            onChange={handlePlanChange} // Ajout du gestionnaire onChange
                        />
                    </div>
                </div>
                <div className="mt-8 p-4 bg-gray-800 rounded-lg">
                    <div className="grid md:grid-cols-4 gap-4 text-center">
                        <div className="p-3">
                            <div className="text-gray-400 text-sm">Profit quotidien</div>
                            <div className="text-xl font-bold text-cyan-400">${dailyProfit.toFixed(2)}</div>
                        </div>
                        <div className="p-3">
                            <div className="text-gray-400 text-sm">Profit hebdomadaire</div>
                            <div className="text-xl font-bold text-cyan-400">${weeklyProfit.toFixed(2)}</div>
                        </div>
                        <div className="p-3">
                            <div className="text-gray-400 text-sm">Profit mensuel</div>
                            <div className="text-xl font-bold text-cyan-400">${monthlyProfit.toFixed(2)}</div>
                        </div>
                        <div className="text-center mt-4">
                            <div className="text-gray-400 text-sm">Profit total</div>
                            <div className="text-xl font-bold text-cyan-400">${profit.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProfitCalculator
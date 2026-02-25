 
import { AdminStat, RecentActivity, ReferralStats } from '@/types'

  export const statsData: AdminStat[] = [
    { 
      title: "Utilisateurs totaux", 
      value: "1,245", 
      change: "+12.5%", 
      icon: "👥" 
    },
    { 
      title: "Investissements totaux", 
      value: "$342,450.75", 
      change: "+8.2%", 
      icon: "📊" 
    },
    { 
      title: "Retraits ce mois", 
      value: "$42,340.50", 
      change: "-3.7%", 
      icon: "💸" 
    },
    { 
      title: "Nouveaux utilisateurs", 
      value: "87", 
      change: "+5.2%", 
      icon: "🆕" 
    },
    { 
      title: "KYC en attente", 
      value: "23", 
      change: "+3", 
      icon: "🆔" 
    }
  ]

  // Activités récentes
  export const recentActivitiesData: RecentActivity[] = [
    {
      id: 'ACT-78945',
      user: 'admin@juatradx.com',
      action: 'Approuvé retrait #WD-78456',
      date: '15/06/2023 14:30',
      status: 'COMPLETED'
    },
    {
      id: 'ACT-78123',
      user: 'admin@juatradx.com',
      action: 'Rejeté KYC #KYC-78234',
      date: '15/06/2023 12:15',
      status: 'COMPLETED'
    },
    {
      id: 'ACT-78456',
      user: 'admin@juatradx.com',
      action: 'Mis à jour plan Premium',
      date: '15/06/2023 10:45',
      status: 'COMPLETED'
    },
    {
      id: 'ACT-78234',
      user: 'admin@juatradx.com',
      action: 'Créé nouvel utilisateur',
      date: '15/06/2023 09:30',
      status: 'COMPLETED'
    },
    {
      id: 'ACT-78567',
      user: 'admin@juatradx.com',
      action: 'Modifié paramètres système',
      date: '14/06/2023 18:20',
      status: 'COMPLETED'
    }
  ]


  export const investmentsData = [
      {
        id: 'INV-78945',
        user: 'john.doe@example.com',
        plan: 'Plan Premium',
        amount: '$5,000.00',
        date: '15/06/2023',
        startDate: '15/06/2023',
        endDate: '30/07/2023',
        status: 'ACTIVE',
        profitEarned: '$1,250.00',
        expectedProfit: '$2,500.00'
      },
      {
        id: 'INV-78123',
        user: 'jane.smith@example.com',
        plan: 'Plan Starter',
        amount: '$500.00',
        date: '14/06/2023',
        startDate: '14/06/2023',
        endDate: '14/07/2023',
        status: 'ACTIVE',
        profitEarned: '$75.00',
        expectedProfit: '$150.00'
      },
      {
        id: 'INV-78456',
        user: 'robert.johnson@example.com',
        plan: 'Plan VIP',
        amount: '$10,000.00',
        date: '13/06/2023',
        startDate: '13/06/2023',
        endDate: '13/09/2023',
        status: 'COMPLETED',
        profitEarned: '$3,200.00',
        expectedProfit: '$3,200.00'
      }
    ]


export const InvestmentPlanData = [
    {
      id: 'PLN-001',
      name: 'Plan Starter',
      dailyProfit: '1.5%',
      duration: '30 jours',
      minAmount: '$100',
      maxAmount: '$1,000',
      status: 'ACTIVE'
    },
    {
      id: 'PLN-002',
      name: 'Plan Premium',
      dailyProfit: '2.5%',
      duration: '45 jours',
      minAmount: '$1,000',
      maxAmount: '$10,000',
      status: 'ACTIVE'
    },
    {
      id: 'PLN-003',
      name: 'Plan VIP',
      dailyProfit: '3.2%',
      duration: '90 jours',
      minAmount: '$5,000',
      maxAmount: '$50,000',
      status: 'ACTIVE'
    }
  ]


  
  
import { 
  BanknoteArrowUp,
  HandCoins,
  History,
  House,
  User,
  UserPen,
  Users,
  Settings,
  FileText,
  ShieldCheck,
  BarChart2,
  CreditCard,
  PieChart,
  AlertCircle,
  Wallet
} from "lucide-react"
import { ADMIN_DASHBOARD_PATH, ADMIN_ROLE, USER_DASHBOARD_PATH, USER_ROLE } from "./utils"

export const iconWidth = 16

export const sidebarMenuItems = [
  // Menu utilisateur (existant)
  { name: 'Tableau de bord', 
    href: USER_DASHBOARD_PATH, 
    icon: <House width={iconWidth} />, 
    visible: [USER_ROLE], 
  },
  { name: 'Mes investissements', 
    href: USER_DASHBOARD_PATH+'/investments',  
    icon: <HandCoins width={iconWidth} />, 
    visible: [USER_ROLE], 
  },
  { name: 'Parrainage', 
    href: USER_DASHBOARD_PATH+'/referrals',  
    icon: <BanknoteArrowUp width={iconWidth} />, 
    visible: [USER_ROLE], 
  },
  { name: 'Retraits', 
    href: USER_DASHBOARD_PATH+'/withdrawals', 
    icon: <CreditCard width={iconWidth} />, 
    visible: [USER_ROLE], 
  },
  { name: 'Historique', 
    href: USER_DASHBOARD_PATH+'/history', 
    icon: <History width={iconWidth} />, 
    visible: [USER_ROLE], 
  },
  { name: 'Portefeuille', 
    href: USER_DASHBOARD_PATH+'/wallet', 
    icon: <Wallet width={iconWidth} />, 
    visible: [USER_ROLE], 
  },
  { name: 'Profile', 
    href: USER_DASHBOARD_PATH+'/profile',  
    icon: <UserPen width={iconWidth} />, 
    visible: [USER_ROLE], 
  },

  // Menu admin (nouveau)
  { name: 'Tableau de bord', 
    href: ADMIN_DASHBOARD_PATH, 
    icon: <BarChart2 width={iconWidth} />, 
    visible: [ADMIN_ROLE], 
  },
  { name: 'Utilisateurs', 
    href: ADMIN_DASHBOARD_PATH+'/users', 
    icon: <Users width={iconWidth} />, 
    visible: [ADMIN_ROLE],
    dropdown: [
      { label: 'Liste des utilisateurs', href: ADMIN_DASHBOARD_PATH+'/users' },
      { label: 'Nouvel utilisateur', href: ADMIN_DASHBOARD_PATH+'/users/new' },
    ]
  },
  
  { name: 'Investissements', 
    href: ADMIN_DASHBOARD_PATH+'/investments', 
    icon: <PieChart width={iconWidth} />, 
    visible: [ADMIN_ROLE],
  },
  { name: 'Dépots', 
    href: ADMIN_DASHBOARD_PATH+'/deposits', 
    icon: <CreditCard width={iconWidth} />, 
    visible: [ADMIN_ROLE],
  },
  { name: 'Retraits', 
    href: ADMIN_DASHBOARD_PATH+'/withdrawals', 
    icon: <CreditCard width={iconWidth} />, 
    visible: [ADMIN_ROLE],
  },

  { name: 'Transactions', 
    href: ADMIN_DASHBOARD_PATH+'/transactions', 
    icon: <FileText width={iconWidth} />, 
    visible: [ADMIN_ROLE] 
  },
  { name: 'Vérifications KYC', 
    href: ADMIN_DASHBOARD_PATH+'/kyc',
    icon: <ShieldCheck width={iconWidth} />, 
    visible: [ADMIN_ROLE],
  },
  { name: 'Parrainage', 
    href: ADMIN_DASHBOARD_PATH+'/referrals', 
    icon: <BanknoteArrowUp width={iconWidth} />, 
    visible: [ADMIN_ROLE] 
  },
  { name: 'Paramètres', 
    href: ADMIN_DASHBOARD_PATH+'/settings', 
    icon: <Settings width={iconWidth} />, 
    visible: [ADMIN_ROLE],
    dropdown: [
      { label: 'Paramètres généraux', href: ADMIN_DASHBOARD_PATH+'/settings/general' },
      { label: 'Taux et commissions', href: ADMIN_DASHBOARD_PATH+'/settings/rates' },
      { label: 'Alertes système', href: ADMIN_DASHBOARD_PATH+'/settings/alerts' }
    ]
  },
  { name: 'Rapports', 
    href: ADMIN_DASHBOARD_PATH+'/reports', 
    icon: <FileText width={iconWidth} />, 
    visible: [ADMIN_ROLE],
    dropdown: [
      { label: 'Rapports financiers', href: ADMIN_DASHBOARD_PATH+'/reports/financial' },
      { label: 'Rapports d\'activité', href: ADMIN_DASHBOARD_PATH+'/reports/activity' }
    ]
  }
]
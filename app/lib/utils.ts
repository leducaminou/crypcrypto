import { DocumentType,  PaymentMethod,  TransactionType } from "@prisma/client";


 import { TransactionStatus, ReferralStatus, InvestmentStatus, TransactionStatusType } from '@/types';


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// app/lib/utils/bigint.ts
export function bigIntReplacer(key: string, value: any) {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  return value
}

// Map des préfixes pour chaque type de transaction
// const transactionPrefixes: Record<TransactionType, string> = {
//   [TransactionType.DEPOSIT]: 'DE',
//   [TransactionType.WITHDRAWAL]: 'WI',
//   [TransactionType.INVESTMENT]: 'IN',
//   [TransactionType.DIVIDEND]: 'DI',
//   [TransactionType.REFERRAL]: 'REF',
//   [TransactionType.FEE]: 'FEE',
// };

// // Tableau des lettres majuscules (A-Z)
// const uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';



// Définir les préfixes pour les références de transaction
export const transactionPrefixes: Record<TransactionType, string> = {
  DEPOSIT: 'DEP',
  WITHDRAWAL: 'WTH',
  INVESTMENT: 'INV',
  DIVIDEND: 'DIV',
  REFERRAL: 'REF',
  FEE: 'FEE',
};

// Lettres majuscules pour la génération de référence
export const uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateTransactionReference(type: TransactionType): string {
  // Vérifier que le type de transaction est valide
  if (!transactionPrefixes[type]) {
    throw new Error(`Type de transaction invalide : ${type}`);
  }

  // Obtenir le préfixe correspondant
  const prefix = transactionPrefixes[type];

  // Générer 10 chiffres aléatoires
  const digits = Math.floor(Math.random() * 10000000000)
    .toString()
    .padStart(10, '0'); // Assure exactement 10 chiffres

  // Générer une lettre majuscule aléatoire
  const randomLetter = uppercaseLetters[Math.floor(Math.random() * 26)];

  // Combiner les parties pour créer la référence
  return `${prefix}-${digits}${randomLetter}`;
}

export const MENU_ICON_PARAMS = {
  color: 'FFFFFF',
  size: 16,
};

export const ADMIN_ROLE = 'ADMIN';
export const USER_ROLE = 'USER';

// Définir les rôles possibles
export enum Roles {
  ADMIN = "ADMIN",
  USER = "USER",
}


export const ADMIN_DASHBOARD_PATH = '/admin';
export const USER_DASHBOARD_PATH = '/dashboard';

export const PROFIL_PIC_PATH = "/uploads/profil_pics"

export function getRedirectUrl(role: string): string {
  switch (role) {
    case ADMIN_ROLE:
      return ADMIN_DASHBOARD_PATH;
    case USER_ROLE:
      return USER_DASHBOARD_PATH;
    default:
      return '/';
  }
}


export const countries = [
  { name: "Bénin", id: "BJ", code: "+229" },
  { name: "Cameroun", id: "CM", code: "+237" },
  { name: "Côte d'Ivoire", id: "CI", code: "+225" },
  { name: "Gabon", id: "GA", code: "+241" },
  { name: "Mali", id: "ML", code: "+223" },
  { name: "RCA", id: "CF", code: "+236" },
  { name: "République du Congo", id: "CG", code: "+242" },
  { name: "Tchad", id: "TD", code: "+235" },
  { name: "Togo", id: "TG", code: "+228" },
]



   
export  const countryList =  [
      { id: "BN", title: "Bénin" },
      { id: "CM", title: "Cameroun" },
      { id: "CI", title: "Côte d'Ivoire" },
      { id: "GB", title: "Gabon" },
      { id: "ML", title: "Mali" },
      { id: "RCA", title: "RCA" },
      { id: "RDC", title: "République du Congo" },
      { id: "TCH", title: "Tchad" },
      { id: "TOG", title: "Togo" },
    ];


export const DocumentTypeList =  [
      { id: DocumentType.PASSPORT, title: "PassPort" },
      { id: DocumentType.ID_CARD, title: "Carte nationale" },
      { id: DocumentType.DRIVER_LICENSE, title: "Permis de conduire" },
    ];



/**
 * Formate une date au format JJ/MM/AAAA
 * @param dateString - Chaîne ISO ou objet Date
 * @returns Date formatée (ex: "24/07/2025") ou chaîne vide si la date est invalide
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) {
    return '';
  }

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return '';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Les mois sont 0-indexés
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return '';
  }
}





  export function getPaiementMethod(data: PaymentMethod | undefined ): string {

    if(!PaymentMethod) return ''

    switch (data) {
      case PaymentMethod.BITCOIN:
        return "Bitcoin (BTC)";
      case PaymentMethod.ETHEREUM:
        return "Ethereum (ETH)";
      case PaymentMethod.USDT:
        return "USDT";
      case PaymentMethod.MOBILE:
        return "Paiement mobile";
    
      default:
        return "Autres";
    }
  }


export function getStatusTranslation(
  data: string | ReferralStatus | InvestmentStatus | TransactionStatus | TransactionStatusType
): string {
  if (!data) return '';

  switch (data) {
    case 'PENDING':
    case 'pending':
    case TransactionStatus.PENDING:
    case ReferralStatus.PENDING:
      return "En attente";
    
    case 'ACTIVE':
    case 'active':
    case ReferralStatus.ACTIVE:
    case InvestmentStatus.ACTIVE:
      return "Actif";
    
    case 'rewarded':
    case 'REWARDED':
    case ReferralStatus.REWARDED:
      return "RÉCOMPENSÉ";
    
    case 'inactive':
    case 'INACTIVE':
    case ReferralStatus.INACTIVE:
      return "Inactif";
    
    case 'COMPLETED':
    case 'completed':
    case TransactionStatus.COMPLETED:
    case InvestmentStatus.COMPLETED:
      return "Terminé";
    
    case 'FAILED':
    case 'failed':
    case TransactionStatus.FAILED:
      return "Échoué";
    
    case 'cancelled':
    case 'CANCELLED':
    case InvestmentStatus.CANCELLED:
    case TransactionStatus.CANCELLED:
      return "Annulé";
    
    default:
      return "";
  }
}

// export function getStatusColor(status: TransactionStatus | TransactionStatusType): string {
//   switch (status) {
//     case TransactionStatus.COMPLETED:
//     case TransactionStatus.COMPLETED.toLocaleLowerCase():
//     case 'COMPLETED':
//       return 'bg-green-500 bg-opacity-20 text-green-300';
    
//     case TransactionStatus.PENDING:
//     case TransactionStatus.PENDING.toLocaleLowerCase():
//     case 'PENDING':
//       return 'bg-yellow-500 bg-opacity-20 text-yellow-300';
    
//     case TransactionStatus.FAILED:
//     case TransactionStatus.FAILED.toLocaleLowerCase():
//     case 'FAILED':
//       return 'bg-red-500 bg-opacity-20 text-red-300';
    
//     case TransactionStatus.CANCELLED:
//     case TransactionStatus.CANCELLED.toLocaleLowerCase():
//     case 'CANCELLED':
//       return 'bg-gray-500 bg-opacity-20 text-gray-300';
    
//     default:
//       return 'bg-gray-500 bg-opacity-20 text-gray-300';
//   }
// }


export function getStatusColor(status: string): string {
  switch (status) {
    case "COMPLETED":
    case "completed":
      return 'bg-green-500 bg-opacity-20 text-green-300';
    
    case "PENDING":
    case "pending":
      return 'bg-yellow-500 bg-opacity-20 text-yellow-300';
    
    case "FAILED":
    case "failed":
    case 'FAILED':
      return 'bg-red-500 bg-opacity-20 text-red-300';
    
    case "CANCELLED":
    case "canceled":
      return 'bg-gray-500 bg-opacity-20 text-gray-300';
    
    default:
      return 'bg-gray-500 bg-opacity-20 text-gray-300';
  }
}
 
 
  export function getTransactionTypeTranslation(data: string 
    | TransactionType
  ): string {

    if(!data) return ''

    switch (data) {

      case 'DEPOSIT':
      case TransactionType.DEPOSIT:
        return 'Dépot';

      case 'WITHDRAWAL':
      case TransactionType.WITHDRAWAL:
        return 'Retrait';

      case 'INVESTMENT':
      case TransactionType.INVESTMENT:
        return 'Investissement';

      case 'DEPOSIT':
      case TransactionType.DEPOSIT:
        return 'Dépot';

      case 'DIVIDEND':
      case TransactionType.DIVIDEND:
        return 'Dividende';

      case 'REFERRAL':
      case TransactionType.REFERRAL:
        return 'Filleul';

      case 'FEE':
      case TransactionType.FEE:
        return 'Frais';

      case 'BONUS':
        return 'Bonus';


      default:
        return ''
    }
  }


 export const PaymentMethodList = [
        { id:  PaymentMethod.MOBILE, title: "Paiement mobile"  },
        { id:  PaymentMethod.BITCOIN, title: "Bitcoin (BTC)" },
        { id:  PaymentMethod.ETHEREUM, title: "Ethereum (ETH)"  },
        { id:  PaymentMethod.USDT, title: "USDT"  },
      ]

// Ajoutez cette fonction à votre fichier existant utils.ts
export const generateReferralCode = (): string => {
  const min = 10000; // Le plus petit nombre à 5 chiffres
  const max = 99999; // Le plus grand nombre à 5 chiffres
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};



// app/lib/utils.ts

/**
 * Calcule le profit basé sur le montant, la durée en jours et le pourcentage de profit quotidien.
 * @param amount - Montant investi (en dollars).
 * @param durationDays - Durée du plan d'investissement en jours.
 * @param dailyProfitPercent - Pourcentage de profit quotidien.
 * @returns Le profit total calculé.
 */
export function calculateProfit(
  amount: number,
  durationDays: number,
  dailyProfitPercent: number
): number {
  // Vérification des paramètres
  if (
    isNaN(amount) ||
    isNaN(durationDays) ||
    isNaN(dailyProfitPercent) ||
    amount <= 0 ||
    durationDays <= 0 ||
    dailyProfitPercent < 0
  ) {
    return 0;
  }

  // Calcul du profit : montant * (pourcentage quotidien / 100) * nombre de jours
  const profit = amount * (dailyProfitPercent / 100) * durationDays;
  return Number(profit.toFixed(2)); // Arrondi à 2 décimales
}

// app/lib/serialization.ts
export const sanitizePrismaData = <T>(data: T): T => {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'bigint') {
    return data.toString() as any;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizePrismaData) as any;
  }

  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      result[key] = sanitizePrismaData(data[key]);
    }
    return result;
  }

  return data;
};


export function formatMonetary(numberString: string | null): string {
  if(!numberString){
    return "0.00"
  }
  // Séparer la partie entière et la partie décimale
  const parts = numberString.split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? `.${parts[1]}` : '';

  // Ajouter les séparateurs de milliers
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Recombiner les parties
  return integerPart + decimalPart;
}


export function serializeBigInt(obj: any): any {
  return JSON.parse(
    JSON.stringify(
      obj,
      (key, value) => (typeof value === 'bigint' ? value.toString() : value) // return everything else unchanged
    )
  );
}
import { Gender,  Role } from "@prisma/client";

export type SubmenuItem = {
    label: string;
    href: string;
  };    
  
  export type HeaderItem = {
    label: string;
    href: string;
    submenu?: SubmenuItem[];
  };

export interface NextJsRouteParams {
  params: Promise<{ [key: string]: string }>
}

export interface NextJsIdRouteParams {
  params: Promise<{ id: string }>
}

// export type PaymentMethod =
//   | "BITCOIN"
//   | "ETHEREUM"
//   | "MOBILE"
//   | "USDT"
//   | "OTHER";

export type PaymentMethod =
  | "CRYPTO"
  | "MOBILE"

export type WithdrawalStatus =
  | "PENDING"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED"
  | "PROCESSING";
export type PaymentAccountType = "MOBILE_MONEY" | "CRYPTO";

export interface Withdrawal {
  id: string;
  amount: string;
  method: PaymentMethod;
  date: string;
  status: WithdrawalStatus;
  walletAddress?: string;
}

export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "INVESTMENT"
  | "BONUS"
  | "DIVIDEND";



export interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  date: string;
  status: TransactionStatus;
  details?: string;
  reference?: string;
}

export enum TransactionStatus {
  COMPLETED = "COMPLETED",
  PENDING = "PENDING", 
  FAILED = "FAILED",
  CANCELLED = "CANCELLED"
}

export enum ReferralStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  REWARDED = "REWARDED",
  INACTIVE = "INACTIVE"
}

export enum InvestmentStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export type TransactionStatusType = 
  | "COMPLETED"
  | "PENDING" 
  | "FAILED"
  | "CANCELLED";

export interface Referral {
  id: string;
  email: string;
  signupDate: string;
  status: "PENDING" | "ACTIVE" | "REWARDS";
  earnedAmount?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: string;
  pendingRewards: string;
}

export interface AdminStat {
  title: string;
  value: string;
  change: string;
  icon: string;
}

export interface RecentActivity {
  id: string;
  user: string;
  action: string;
  date: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
}

export interface FormProps {
  type: "create" | "update";
  id?: number;
  data?: any;
  onSuccess?: () => void;
}

export interface AllFormProps {
  type: "create" | "update";
  id?: string;
  otherId?: number;
  balance?: string;
  onSuccess?: (data?: any) => void;
}

export interface AdminUserProfile {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: Role;
  is_email_verified: boolean;
  email_verified_at: string;
  created_at: string;
  updated_at: string;
  last_login_at: string;
  last_login_ip: string;
  remember_token: string;
  is_active: boolean;
  is_locked: boolean;
  referral_code: string;
  referred_by: number;
  profile: {
    address: string;
    city: string;
    postal_code: string;
    date_of_birth: string;
    avatar_url?: string;
    country: string;
    gender: string;
    referralsAsReferrer: Referral;
    referralsAsReferee: Referral;
    created_at: string;
  };
}

export type Investment = {
  id: string;
  userId: string;
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  planId: string;
  plan: {
    name: string;
  };
  transactionId: string;
  amount: string;
  expectedProfit: string;
  profitEarned: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
};

export type InvestmentPlan = {
  id: string;
  name: string;
  description: string | null;
  minAmount: number;
  maxAmount: number | null;
  dailyProfitPercent: number;
  durationDays: number;
  isActive: boolean;
  withdrawalLockDays: number;
  capitalReturn: boolean;
  createdAt: string;
  updatedAt: string;
};

export interface ColumnDefinition<T> {
  header: string;
  accessor?: keyof T;
  cell?: (row: T) => React.ReactNode;
}

export interface UserResponse {
  user: {
    id: string;
    email: string;
    password_hash: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    role: string;
    verification_token: string | null;
    is_email_verified: boolean;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    last_login_at: string | null;
    last_login_ip: string | null;
    remember_token: string | null;
    is_active: boolean;
    is_locked: boolean;
    referral_code: string;
    referred_by: string | null;
    country?: {
      id: number;
      name: string;
      dial_code: string;
      country_code: string;
      
    } | null;
    profile: {
      address: string;
      city: string;
      postal_code: string;
      
      date_of_birth: string;
      gender: Gender;
      avatar_url: string;
      timezone: string;
      preferred_language: string;
    } | null;
    wallet?: {
      name: string;
      dial_code: string;
      country_code: string;
      
    } | null;
  };
  referredUsers: ReferredUser[];
  referralStats: ReferralStats;
}

export interface UserResponseNew {
   id: string;
    email: string;
    password_hash: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    role: string;
    verification_token: string | null;
    is_email_verified: boolean;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    last_login_at: string | null;
    last_login_ip: string | null;
    remember_token: string | null;
    is_active: boolean;
    is_locked: boolean;
    referral_code: string;
    referred_by: string | null;
    country?: {
      name: string;
      dial_code: string;
      country_code: string;
      
    } | null;
  referredUsers: ReferredUser[];
  referralStats: ReferralStats;
}

export interface ReferredUser {
  id: string;
  email: string;
  created_at: string;
  is_active: boolean;
  has_deposits: boolean;
  bonus_earned: number;
  transactions: {
    id: string;
    amount: string;
    created_at: string;
  }[];
}

// Interface pour la réponse de l'API d'investissement
export interface InvestmentResponse {
  id: string;
  user_id: string;
  plan: {
    id: string;
    name?: string;
  };
  transaction: {
    id: string;
  };
  amount: string;
  expected_profit: string;
  profit_earned: string;
  total_profit_calculated: string;
  profits: {
    id: string;
    investment_id: string;
    amount: string;
    profit_date: string;
    is_compounded: boolean;
  }[];
  start_date: string;
  end_date: string;
  status: InvestmentStatus;
  created_at: string;
  updated_at: string;
}

export interface TransactionResponse {
  id: string;
  user_id: string;
  wallet_id: string;
  txid: string | null;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  fee: string;
  
  reference: string | null;
  details: string | null;
  metadata: any | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  paymentAccount?: {
    id: string;
    type: PaymentMethod;
    account_identifier: string;
    provider: string;
  } | null;
}

export interface AdminUserWithStats {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: Role;
  is_email_verified: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  last_login_ip: string | null;
  is_active: boolean;
  is_locked: boolean;
  referral_code: string;
  referred_by: string | null;
  country: {
    name: string;
    dial_code: string;
    country_code: string;
    
  } | null;
  referred_by_name: string | null;
  investment: number;
  profit: number;
  Wallet_1: number;
  Wallet_2: number;
  balance: number;
  referree: number;
  referree_profit: number;
}

export interface AdminUsersResponse {
  users: AdminUserWithStats[];
  total: number;
  page: number;
  limit: number;
}

export interface WalletResponse {
  id: string;
  user_id: string;
  balance: string;
  locked_balance: string;
  created_at: string;
  updated_at: string;
  transactions: {
    id: string;
    user_id: string;
    wallet_id: string;
    payment_account_id: string | null;
    txid: string | null;
    type: TransactionType;
    status: TransactionStatus;
    amount: string;
    fee: string;
    
    wallet_address: string | null;
    reference: string | null;
    details: string | null;
    metadata: any | null;
    processed_at: string | null;
    created_at: string;
    updated_at: string;
    payment_account?: {
      type: PaymentMethod;
      account_identifier: string;
      provider: string;
    } | null;
  }[];
}

export interface WithdrawalResponse {
  id: string;
  transaction_id: string;
  user_id: string;
  payment_account_id: string | null;
  payment_method: PaymentMethod | null;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  transaction: {
    id: string;
    user_id: string;
    wallet_id: string;
    payment_account_id: string | null;
    txid: string | null;
    type: TransactionType;
    status: TransactionStatus;
    amount: string;
    fee: string;
    
    wallet_address: string | null;
    reference: string | null;
    details: string | null;
    metadata: any | null;
    processed_at: string | null;
    created_at: string;
    updated_at: string;
  };
  payment_account?: {
    type: PaymentMethod;
    account_identifier: string;
    provider: string;
  } | null;
}

export interface PaymentAccount {
  id: string;
  user_id: string;
  type: PaymentMethod;
  account_identifier: string;
  provider: string;
  crypto_currency?: string | null;
  network?: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentAccountResponse {
  id: string;
  user_id: string;
  type: PaymentMethod;
  account_identifier: string;
  provider: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type KycStatus = "PENDING" | "APPROVED" | "REJECTED";
export type DocumentType = "PASSPORT" | "ID_CARD" | "DRIVER_LICENSE";

export interface KycUser {
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export interface KycVerification {
  id: string;
  user_id: string;
  user: KycUser;
  document_type: DocumentType;
  document_number: string;
  document_front_url: string;
  document_back_url: string | null;
  selfie_url: string;
  status: KycStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KycResponse {
  kycVerifications: KycVerification[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminReferral {
  id: string;
  referred_by: string;
  user_id: string;
  referrer_name: string;
  referrer_email: string;
  referee_name: string;
  referee_email: string;
  earnings: number;
  status: ReferralStatus;
  signed_up_at: string;
  first_deposit_at: string | null;
  last_earning_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminReferralsResponse {
  referrals: AdminReferral[];
  total: number;
  page: number;
  limit: number;
}

export interface Notification {
  id: bigint | string;
  user_id: bigint | string;
  title: string;
  message: string;
  type: 'SYSTEM' | 'TRANSACTION' | 'KYC' | 'SECURITY';
  is_read: boolean;
  read_at: Date | null;
  metadata: any;
  created_at: Date;
}

export interface SystemAlert {
  id: bigint | string;
  title: string;
  message: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  start_date: Date;
  end_date: Date | null;
  is_active: boolean;
  created_at: Date;
}

export interface NotificationData {
  personalNotifications: Notification[];
  systemAlerts: SystemAlert[];
  unreadCount: number;
}

// app/lib/validations/WalletSchema.ts
import { PaymentMethod, WalletType, TransactionType } from '@prisma/client';
import { z } from 'zod';

export const WalletSchema = z.object({
  user_id: z.string().optional(),
  wallet_id: z.string().min(1, "Wallet ID is required"),
  payment_account_id: z.string().min(1, "Veuillez sélectionner un compte de paiement"),
  
  amount: z.union([
    z.number().positive("Le montant doit être positif"),
    z.string()
      .min(1, "Le montant est requis")
      .refine(val => !isNaN(Number(val)) && Number(val) > 0, "Doit être un nombre positif")
  ]).transform(val => {
    return typeof val === 'string' ? Number(val) : val;
  }).refine(val => typeof val === 'number' && val > 0, {
    message: "Le montant doit être un nombre positif"
  }), 
  
  status: z.nativeEnum(WalletType).optional(),
})

// Type pour le formulaire (avant transformation)
export type WalletFormInput = {
  user_id?: string;
  wallet_id: string;
  payment_account_id: string;
  amount: string | number;
  status?: WalletType;
}

// Type pour les données après validation
export type WalletShemaType = z.infer<typeof WalletSchema>
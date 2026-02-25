import { z } from "zod";
import { TransactionStatus } from "@prisma/client";



export const WithdrawalSchema = z.object({
  user_id: z.string().optional(),
  wallet_id: z.string().min(1, "Wallet ID is required"),
  payment_account_id: z.string().min(1, "Veuillez sélectionner un compte de paiement"),
  
  status: z.nativeEnum(TransactionStatus).optional(),
  amount: z.union([
    z.number().positive("Le montant doit être positif"),
    z.string()
      .min(1, "Le montant est requis")
      .refine(val => !isNaN(Number(val)), "Doit être un nombre")
  ]).transform(val => Number(val)), 
  
});

export type WithdrawalSchemaType = z.infer<typeof WithdrawalSchema>;


import { z } from 'zod';

export const TransactionSchema = z.object({
  proof_of_payment: z
    .string()
    .refine(
      (value) => 
        value === null || 
        value === undefined || 
        value === '' || 
        /^\/proofs\/[a-zA-Z0-9\-_.]+$/.test(value),
      {
        message: "Doit être un chemin de fichier valide (ex: /proofs/fichier.jpg)"
      }
    )
    .optional()
    .nullable(),
});

export type TransactionSchemaType = z.infer<typeof TransactionSchema>;





export const CryptoTransactionSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  wallet_id: z.string().min(1, "Wallet ID is required"),
  amount: z.number({
    required_error: "Le montant est requis",
    invalid_type_error: "Le montant doit-être un nombre"
  })
  .min(0.01, "Amount le motant doit être supérieur à 0")
  .max(100000, "Le montant ne peut exceder $100,000")
  .refine(val => !isNaN(val) && isFinite(val), {
    message: "Le montant doit-être un nombre"
  }),
  crypto_currency: z.string()
    .min(1, "Selectionnez une cryptomonnaie")
    .refine(val => ['btc', 'eth', 'usdt', 'bnb', 'usdc'].includes(val.toLowerCase()), {
      message: "Selectionnez une cryptomonnaie valide"
    }),
});

export type CryptoTransactionSchemaType = z.infer<typeof CryptoTransactionSchema>;
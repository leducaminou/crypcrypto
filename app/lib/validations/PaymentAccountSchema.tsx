import { PaymentMethod } from '@prisma/client';
import { z } from 'zod';

export const paymentAccountSchema = z.object({
  user_id: z.string(),
  account_identifier: z.string().min(1, "L'identifiant du compte est requis"),
  provider: z.string().min(1, "Le fournisseur est requis"),
  crypto_currency: z.string().optional(),
  type: z.nativeEnum(PaymentMethod),
  is_default: z.boolean().optional(),
});

export type PaymentAccountSchemaType = z.infer<typeof paymentAccountSchema>;
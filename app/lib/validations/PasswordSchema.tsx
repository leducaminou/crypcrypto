

import { InvestmentStatus } from '@prisma/client';
import { z } from 'zod';

export const PasswordSchema = z.object({
  id: z.string().optional(),
  password: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' }),
  confirmPassword: z.string().min(1, { message: 'La confirmation du mot de passe est requise' }),
});
export type PasswordSchemaType = z.infer<typeof PasswordSchema>;
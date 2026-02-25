import { Gender } from '@prisma/client';
import { z } from 'zod';

export const UserProfileSchema = z.object({
  user_id: z.string().optional(),
  first_name: z.string().min(1, { message: 'Le prénom doit contenir au moins 1 caractère' }),
  last_name: z.string().min(1, { message: 'Le nom doit contenir au moins 1 caractère' }),
  email: z.string()
    .email({ message: 'Veuillez entrer une adresse email valide' })
    .transform(val => val.toLowerCase()),
  country_id: z.string().min(1, { message: 'Le pays est réquis' }),
  phone: z.string()
    .transform(val => val.replace(/\s+/g, ''))
    .optional()
    .or(z.literal('')),
  date_of_birth: z.string()
    .optional()
    .transform(val => val || undefined),
  address: z.string()
    .optional()
    .transform(val => val || undefined),
  city: z.string()
    .optional()
    .transform(val => val || undefined),
  postal_code: z.string()
    .optional()
    .transform(val => val || undefined),
  gender: z.nativeEnum(Gender)
    .optional()
    .transform(val => val || undefined), // Supprimé .or(z.literal('')) et simplifié
});

export type UserProfileSchemaType = z.infer<typeof UserProfileSchema>;
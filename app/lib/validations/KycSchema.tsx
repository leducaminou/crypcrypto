import { z } from 'zod';

export const KycSchema = z.object({
  document_type: z.enum(['PASSPORT', 'ID_CARD', 'DRIVER_LICENSE']),
  document_number: z.string().min(1, "Le numéro de document est requis"),
  document_front_url: z.string().url("URL du recto invalide"),
  document_back_url: z.string().url("URL du verso invalide").optional().or(z.literal('')),
  selfie_url: z.string().url("URL de la selfie invalide"),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  rejection_reason: z.string().optional().or(z.literal('')),
});

export type KycSchemaType = z.infer<typeof KycSchema>;
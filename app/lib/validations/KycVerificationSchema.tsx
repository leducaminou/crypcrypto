

import { DocumentType } from '@prisma/client';
import { z } from 'zod';

export const KycVerificationSchemaSchema = z.object({
  user_id: z.string().optional(),
document_type: z.nativeEnum(DocumentType),
  document_number: z.string().min(8, { message: 'Le prénom doit contenir au  moins 1 caractère' }),
  document_front_url: z.any(),
  document_back_url: z.any(),
  selfie_url: z.any(),

});
export type KycVerificationSchemaSchemaType = z.infer<typeof KycVerificationSchemaSchema>;
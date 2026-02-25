
import { z } from 'zod';

export const ProfitCalculatorSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Le montant doit être un nombre positif'
  }),
  plan_id: z.string().min(1, "Veuillez sélectionner un plan"),
})

export type ProfitCalculatorShemaType = z.infer<typeof ProfitCalculatorSchema>

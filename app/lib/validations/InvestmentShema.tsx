import { z } from 'zod';

export const InvestmentSchema = z.object({
  user_id: z.string().optional(),
  wallet_id: z.string().min(1, "Un compte est nécessaire"),
  plan_id: z.string().min(1, "Veuillez sélectionner un plan"),
  
  amount: z.union([
    z.number().positive("Le montant doit être positif"),
    z.string()
      .min(1, "Le montant est requis")
      .refine(val => !isNaN(Number(val)) && Number(val) > 0, "Doit être un nombre positif")
  ]).transform(val => {
    if (typeof val === 'string') {
      return Number(val);
    }
    return val;
  }), 
});

export type InvestmentSchemaType = z.infer<typeof InvestmentSchema>;

export const InvestmentPlanSchema = z.object({
  name: z.string().min(1, "Le nom du plan est requis"),
  min_amount: z
    .coerce
    .number({ invalid_type_error: "Le montant minimum doit être un nombre valide" })
    .min(0, "Le montant minimum doit être supérieur ou égal à 0")
    .refine(
      (val) => Number(val.toFixed(2)) === val,
      "Le montant minimum doit avoir au maximum 2 chiffres après la virgule"
    ),
  max_amount: z
    .coerce
    .number({ invalid_type_error: "Le montant maximum doit être un nombre valide" })
    .min(0, "Le montant maximum doit être supérieur ou égal à 0")
    .refine(
      (val) => Number(val.toFixed(2)) === val,
      "Le montant maximum doit avoir au maximum 2 chiffres après la virgule"
    )
    .optional(),
  daily_profit_percent: z
    .coerce
    .number({ invalid_type_error: "Le pourcentage de profit quotidien doit être un nombre valide" })
    .min(0, "Le pourcentage de profit quotidien doit être supérieur ou égal à 0")
    .refine(
      (val) => Number(val.toFixed(2)) === val,
      "Le pourcentage de profit quotidien doit avoir au maximum 2 chiffres après la virgule"
    ),
  duration_days: z
    .coerce
    .number({ invalid_type_error: "La durée doit être un nombre valide" })
    .int()
    .min(1, "La durée doit être d'au moins 1 jour"),
  withdrawal_lock_days: z
    .coerce
    .number({ invalid_type_error: "Les jours de verrouillage doivent être un nombre valide" })
    .int()
    .min(0, "Les jours de verrouillage doivent être supérieurs ou égaux à 0"),
  description: z.string().optional(),
  is_active: z.enum(["true", "false"]).optional(),
  capital_return: z.enum(["true", "false"]).optional(),
}).refine(
  (data) => data.max_amount === undefined || data.min_amount <= data.max_amount,
  {
    message: "Le montant minimum ne peut pas être supérieur au montant maximum",
    path: ["max_amount"],
  }
);
export type InvestmentPlanSchemaType = z.infer<typeof InvestmentPlanSchema>;
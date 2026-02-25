import { z } from 'zod';


export const LoginSchema = z.object({
  identifier: z.string().min(1, "Identifiant requis"),
  password: z.string().min(1, { message: 'Le mot de passe est requis' }),
  rememberMe: z.boolean().optional(),
});
export type LoginSchemaType = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Veuillez entrer une adresse email valide' }),
});
export type ForgotPasswordSchemaType = z.infer<typeof ForgotPasswordSchema>;



const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const RegisterSchema = z.object({
  email: z.string()
    .email({ message: 'Veuillez entrer une adresse email valide' })
    .transform(val => val.toLowerCase()),
  country_id: z.string().min(1, { message: 'Le pays est réquis' }),
  phonenumber: z.string()
    .min(1, { message: 'Le numéro de téléphone est requis' })
    .transform(val => val.replace(/\s+/g, '')),
  referred_code: z.string().optional(),
  password: z.string()
    .min(8, { message: 'Le mot de passe doit contenir entre 8 et 20 caractères' })
    .max(20, { message: 'Le mot de passe doit contenir entre 8 et 20 caractères' })
    .regex(passwordRegex, {
      message: 'Le mot de passe doit contenir au moins une majuscule, un chiffre et un caractère spécial (@$!%*?&)',
    }),
  confirmPassword: z.string().min(1, { message: 'La confirmation du mot de passe est requise' }),
  terms: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter les conditions d'utilisation" }),
  }),
}).superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Les mots de passe ne correspondent pas',
      path: ['confirmPassword'],
    });
  }
});

export type RegisterSchemaType = z.infer<typeof RegisterSchema>;
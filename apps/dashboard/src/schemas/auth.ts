import { z } from "zod";

const USERNAME_MIN = 3;
const USERNAME_MAX = 30;
const PASSWORD_MIN = 8;

export const registerSchema = z.object({
  username: z
    .string()
    .min(USERNAME_MIN, `Le nom d'utilisateur doit contenir au moins ${USERNAME_MIN} caractères`)
    .max(USERNAME_MAX, `Le nom d'utilisateur doit contenir au maximum ${USERNAME_MAX} caractères`),
  email: z.string().email("Email invalide"),
  password: z.string().min(PASSWORD_MIN, `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères`),
  passwordVerif: z.string(),
  acceptTerms: z.literal(true, { message: "Vous devez accepter les CGU" }),
}).refine((data) => data.password === data.passwordVerif, {
  message: "Les mots de passe ne correspondent pas",
  path: ["passwordVerif"],
});

export const loginSchema = z.object({
  email: z.string().min(1, "Email ou nom d'utilisateur requis"),
  password: z.string().min(1, "Mot de passe requis"),
  returnTo: z.string().optional(),
});

export const totpSchema = z.object({
  totp: z.string().length(6, "Le code doit contenir 6 chiffres"),
  returnTo: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TotpInput = z.infer<typeof totpSchema>;

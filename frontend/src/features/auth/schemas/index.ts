import { z } from "zod";

/**
 * Login form schema — mirrors swagger `LoginRequest` ({ login, motDePasse }).
 * `login` accepts the backend's login string (email-shaped logins still
 * pass the plain string validation).
 */
export const AuthSchema = z.object({
  login: z
    .string()
    .min(1, "Le login est obligatoire")
    .max(100, "Le login ne peut dépasser 100 caractères"),
  motDePasse: z.string().min(1, "Le mot de passe est obligatoire"),
});

export type AuthFormData = z.infer<typeof AuthSchema>;

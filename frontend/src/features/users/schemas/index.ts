import { z } from "zod";

/**
 * Users form schemas — mirror the swagger write shapes:
 *  - create → `RegisterRequest` (login + motDePasse required, admin-only endpoint)
 *  - edit   → `UtilisateurUpdateDTO` (login/password immutable)
 * Messages in French to match the schema convention.
 */

/** Shared identity + role fields, per `UtilisateurUpdateDTO`. */
const userBaseSchema = z.object({
  firstName: z
    .string()
    .min(1, "Le prénom est obligatoire")
    .max(50, "Le prénom ne peut dépasser 50 caractères"),
  lastName: z
    .string()
    .min(1, "Le nom est obligatoire")
    .max(50, "Le nom ne peut dépasser 50 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z
    .string()
    .max(20, "Le téléphone ne peut dépasser 20 caractères")
    .optional(),
  role: z.enum(["ADMIN", "GESTIONNAIRE", "VENDEUR"], {
    message: "Le rôle est obligatoire",
  }),
});

/** Create variant — `login` mirrors RegisterRequest; password policy matches the auth schema (min 1, backend enforces the rest). */
export const UserCreateSchema = userBaseSchema.extend({
  login: z
    .string()
    .min(1, "Le login est obligatoire")
    .max(100, "Le login ne peut dépasser 100 caractères"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .max(100, "Le mot de passe ne peut dépasser 100 caractères"),
});

/** Edit variant — login and password are not editable (UtilisateurUpdateDTO). */
export const UserEditSchema = userBaseSchema;

export type UserCreateFormData = z.infer<typeof UserCreateSchema>;
export type UserEditFormData = z.infer<typeof UserEditSchema>;

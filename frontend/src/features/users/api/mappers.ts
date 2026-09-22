import type {
  RegisterRequestDTO,
  UserCreateInput,
  UserRecord,
  UserUpdateInput,
  UtilisateurResponseDTO,
  UtilisateurUpdateDTO,
} from "../types";
import type { UserInfoDTO } from "@/features/auth/types";

/** `UtilisateurResponseDTO` → `UserRecord` (int64 id → string to avoid JS precision loss). */
export function toUserRecord(dto: UtilisateurResponseDTO): UserRecord {
  return {
    id: String(dto.id),
    login: dto.login,
    firstName: dto.prenom,
    lastName: dto.nom,
    email: dto.mail ?? null,
    phone: dto.numTel ?? null,
    role: dto.role,
  };
}

/** The register response's `user` payload (UserInfo) has the same readable fields — reuse the mapping. */
export function toUserRecordFromUserInfo(dto: UserInfoDTO): UserRecord {
  return {
    id: String(dto.id),
    login: dto.login,
    firstName: dto.prenom,
    lastName: dto.nom,
    email: null,
    phone: null,
    role: dto.role,
  };
}

/** `UserUpdateInput` → `UtilisateurUpdateDTO` (domain → wire, French field names). */
export function toUtilisateurUpdateRequest(
  input: UserUpdateInput,
): UtilisateurUpdateDTO {
  return {
    nom: input.lastName,
    prenom: input.firstName,
    mail: input.email || undefined,
    numTel: input.phone || undefined,
    role: input.role,
  };
}

/** `UserCreateInput` → `RegisterRequestDTO`; `entrepriseId` comes from the admin's session. */
export function toRegisterRequest(
  input: UserCreateInput,
  entrepriseId: number,
): RegisterRequestDTO {
  return {
    entrepriseId,
    login: input.login,
    motDePasse: input.password,
    nom: input.lastName,
    prenom: input.firstName,
    role: input.role,
    mail: input.email || undefined,
    numTel: input.phone || undefined,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { UsersApi } from "../api";
import { toastSuccess } from "@/lib/toast";
import { isHandledError } from "@/lib/error-handler";
import { useAuthStore } from "@/stores/auth.store";
import type { UserCreateInput, UserUpdateInput } from "../types";

/** Query-key factory — `all` for broad invalidation, `list` for the collection, `detail` per row. */
export const usersKeys = {
  all: ["users"] as const,
  list: () => [...usersKeys.all, "list"] as const,
  detail: (id: string) => [...usersKeys.all, "detail", id] as const,
};

export const useUsers = () => {
  return useQuery({
    queryKey: usersKeys.list(),
    queryFn: () => UsersApi.getAll(),
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => UsersApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("users");
  return useMutation({
    mutationFn: (input: UserCreateInput) =>
      UsersApi.create(input, getEntrepriseId()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toastSuccess(t("toast.created"));
    },
    onError: (error) => {
      // Field errors surface inline in the form; only unexpected failures reach the global toast.
      if (isHandledError(error)) return;
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("users");
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdateInput }) =>
      UsersApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({
        queryKey: usersKeys.detail(variables.id),
      });
      toastSuccess(t("toast.updated"));
    },
    onError: (error) => {
      if (isHandledError(error)) return;
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("users");
  return useMutation({
    mutationFn: UsersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toastSuccess(t("toast.deleted"));
    },
  });
};

/**
 * The register endpoint requires `entrepriseId`; the admin creates users
 * inside their own company, so it comes from the session user.
 * (zustand's `getState()` reads the store outside React — safe in callbacks.)
 */
function getEntrepriseId(): number {
  const companyId = useAuthStore.getState().user?.companyId;
  if (!companyId) {
    throw new Error(
      "entrepriseId manquant — impossible de créer un utilisateur sans entreprise rattachée.",
    );
  }
  return Number(companyId);
}

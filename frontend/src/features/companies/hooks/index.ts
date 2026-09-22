import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CompaniesApi } from "../api";
import type { CompanyContactFormData } from "../schemas";
import { toastError, toastSuccess } from "@/lib/toast";

/**
 * Companies hooks — the "Categories pattern" (P0.2/P2): domain data from
 * queryFn, key factory, invalidation on mutation, success toasts; failures
 * are toasted globally by the MutationCache (P1.4).
 */
export const companiesKeys = {
  all: ["companies"] as const,
  list: () => ["companies", "list"] as const,
  detail: (id: string) => ["companies", "detail", id] as const,
};

export const useCompanies = () => {
  return useQuery({
    queryKey: companiesKeys.list(),
    queryFn: () => CompaniesApi.getAll(),
  });
};

export const useCompany = (id: string) => {
  return useQuery({
    queryKey: companiesKeys.detail(id),
    queryFn: () => CompaniesApi.getById(id),
    enabled: !!id,
  });
};

/*
 * NOTE — no `useCreateCompany` here. Creating a tenant always goes through
 * the platform onboarding flow (`useOnboardCompany`), which creates the
 * company AND its first ADMIN in one backend transaction; a company with no
 * admin account would be unreachable by anyone.
 */

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("companies");
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompanyContactFormData }) =>
      CompaniesApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: companiesKeys.all });
      queryClient.invalidateQueries({
        queryKey: companiesKeys.detail(variables.id),
      });
      toastSuccess(t("toast.updated"));
    },
  });
};

/**
 * Delete a tenant.
 *
 * ⚠ The backend refuses with 409 as long as the company still has user
 * accounts — and onboarding always creates one — so in practice a company
 * must be emptied of its users first. Verified against the live API: the raw
 * response is a PostgreSQL foreign-key violation on `utilisateur`, which is
 * not something to show a user, hence the translated message below.
 */
export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("companies");
  return useMutation({
    mutationFn: (id: string) => CompaniesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companiesKeys.all });
      toastSuccess(t("toast.deleted"));
    },
    onError: (error) => {
      if ((error as { status?: number })?.status === 409) {
        toastError(t("toast.deleteConflict"));
        // Handled here — keep the global MutationCache from also toasting
        // the raw database error.
        Object.assign(error as object, { handled: true });
      }
    },
  });
};

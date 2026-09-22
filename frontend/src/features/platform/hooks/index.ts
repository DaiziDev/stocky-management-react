import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PlatformApi } from "../api";
import { companiesKeys } from "@/features/companies/hooks";
import { toastSuccess } from "@/lib/toast";
import type { CompanyOnboarding } from "../types";

/**
 * Platform console hooks — the "Categories pattern": key factory, domain data
 * from queryFn, invalidation on mutation, success toast. Failures surface
 * through the global MutationCache unless the form marks them handled.
 */
export const platformKeys = {
  all: ["platform"] as const,
  stats: () => [...platformKeys.all, "stats"] as const,
};

export const usePlatformStats = () => {
  return useQuery({
    queryKey: platformKeys.stats(),
    queryFn: () => PlatformApi.getStats(),
  });
};

/**
 * Onboard a client company and its first ADMIN.
 *
 * Invalidates the companies list as well as the platform stats: the backend
 * creates a company AND a user in the same transaction, so both the
 * «Entreprises clientes» table and every KPI tile are stale afterwards.
 */
export const useOnboardCompany = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("platform");

  return useMutation({
    mutationFn: (input: CompanyOnboarding) => PlatformApi.onboard(input),
    onSuccess: (company) => {
      queryClient.invalidateQueries({ queryKey: platformKeys.all });
      queryClient.invalidateQueries({ queryKey: companiesKeys.all });
      toastSuccess(t("toast.onboarded", { name: company.name }));
    },
  });
};

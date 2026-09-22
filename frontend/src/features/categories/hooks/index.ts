import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CategoriesApi } from "../api";
import type { CategoriesFormData } from "../schemas";
import { toastSuccess } from "@/lib/toast";

/**
 * Categories hooks — reference pattern for all features (P0.2/P2):
 * - queryFn returns domain data (API layer unwraps Axios + maps DTOs),
 *   so consumers read `data` directly — no `.data.data` chains.
 * - Mutations invalidate the list/detail queries and toast on success;
 *   failures are toasted globally by the MutationCache (P1.4).
 */
export const categoriesKeys = {
  all: ["categories"] as const,
  list: () => ["categories", "list"] as const,
  detail: (id: string) => ["categories", "detail", id] as const,
};

export const useCategories = () => {
  return useQuery({
    queryKey: categoriesKeys.list(),
    queryFn: () => CategoriesApi.getAll(),
  });
};

export const useCategory = (id: string) => {
  return useQuery({
    queryKey: categoriesKeys.detail(id),
    queryFn: () => CategoriesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("categories");
  return useMutation({
    mutationFn: (data: CategoriesFormData) => CategoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
      toastSuccess(t("toast.created"));
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("categories");
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoriesFormData }) =>
      CategoriesApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
      queryClient.invalidateQueries({
        queryKey: categoriesKeys.detail(variables.id),
      });
      toastSuccess(t("toast.updated"));
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("categories");
  return useMutation({
    mutationFn: (id: string) => CategoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
      toastSuccess(t("toast.deleted"));
    },
  });
};

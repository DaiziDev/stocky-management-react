import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArticlesApi } from "../api";
import type { ArticlesFormData } from "../schemas";
import { toastSuccess } from "@/lib/toast";

/**
 * Articles hooks — follows the "Categories pattern" (P0.2/P2):
 * - queryFn returns domain data (API layer unwraps Axios + maps DTOs),
 *   so consumers read `data` directly — no `.data.data` chains.
 * - Mutations invalidate the list queries and toast on success; failures are
 *   toasted globally by the MutationCache (P1.4).
 */
export const articlesKeys = {
  all: ["articles"] as const,
  list: () => ["articles", "list"] as const,
  detail: (id: string) => ["articles", "detail", id] as const,
};

export const useArticles = () => {
  return useQuery({
    queryKey: articlesKeys.list(),
    queryFn: () => ArticlesApi.getAll(),
  });
};

export const useArticle = (id: string) => {
  return useQuery({
    queryKey: articlesKeys.detail(id),
    queryFn: () => ArticlesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateArticle = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("articles");
  return useMutation({
    mutationFn: (data: ArticlesFormData) => ArticlesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articlesKeys.all });
      toastSuccess(t("toast.created"));
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("articles");
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ArticlesFormData }) =>
      ArticlesApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: articlesKeys.all });
      queryClient.invalidateQueries({
        queryKey: articlesKeys.detail(variables.id),
      });
      toastSuccess(t("toast.updated"));
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("articles");
  return useMutation({
    mutationFn: (id: string) => ArticlesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articlesKeys.all });
      toastSuccess(t("toast.deleted"));
    },
  });
};

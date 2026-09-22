import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { SuppliersApi } from "../api";
import { toastSuccess } from "@/lib/toast";
import type { SupplierWrite } from "../types";

/** Query-key factory — `all` for broad invalidation, `list` for the collection, `detail` per row. */
export const suppliersKeys = {
  all: ["suppliers"] as const,
  list: () => [...suppliersKeys.all, "list"] as const,
  detail: (id: string) => [...suppliersKeys.all, "detail", id] as const,
};

export const useSuppliers = () => {
  return useQuery({
    queryKey: suppliersKeys.list(),
    queryFn: () => SuppliersApi.getAll(),
  });
};

export const useSupplier = (id: string) => {
  return useQuery({
    queryKey: suppliersKeys.detail(id),
    queryFn: () => SuppliersApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("suppliers");
  return useMutation({
    mutationFn: (input: SupplierWrite) => SuppliersApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suppliersKeys.all });
      toastSuccess(t("toast.created"));
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("suppliers");
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SupplierWrite }) =>
      SuppliersApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: suppliersKeys.all });
      queryClient.invalidateQueries({
        queryKey: suppliersKeys.detail(variables.id),
      });
      toastSuccess(t("toast.updated"));
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("suppliers");
  return useMutation({
    mutationFn: SuppliersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suppliersKeys.all });
      toastSuccess(t("toast.deleted"));
    },
  });
};

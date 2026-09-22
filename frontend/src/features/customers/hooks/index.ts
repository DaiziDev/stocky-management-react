import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CustomersApi } from "../api";
import { toastSuccess } from "@/lib/toast";
import type { CustomerWrite } from "../types";

/** Query-key factory — `all` for broad invalidation, `list` for the collection, `detail` per row. */
export const customersKeys = {
  all: ["customers"] as const,
  list: () => [...customersKeys.all, "list"] as const,
  detail: (id: string) => [...customersKeys.all, "detail", id] as const,
};

export const useCustomers = () => {
  return useQuery({
    queryKey: customersKeys.list(),
    queryFn: () => CustomersApi.getAll(),
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: customersKeys.detail(id),
    queryFn: () => CustomersApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("customers");
  return useMutation({
    mutationFn: (input: CustomerWrite) => CustomersApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersKeys.all });
      toastSuccess(t("toast.created"));
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("customers");
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerWrite }) =>
      CustomersApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: customersKeys.all });
      queryClient.invalidateQueries({
        queryKey: customersKeys.detail(variables.id),
      });
      toastSuccess(t("toast.updated"));
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("customers");
  return useMutation({
    mutationFn: CustomersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersKeys.all });
      toastSuccess(t("toast.deleted"));
    },
  });
};

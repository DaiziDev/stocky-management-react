import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CustomerOrdersApi } from "../api";
import { toastSuccess } from "@/lib/toast";
import type { CustomerOrderWrite } from "../types";

/** Query-key factory — `all` covers orders + lifecycle side effects on detail queries. */
export const customerOrdersKeys = {
  all: ["customer-orders"] as const,
  list: () => [...customerOrdersKeys.all, "list"] as const,
  detail: (id: string) => [...customerOrdersKeys.all, "detail", id] as const,
};

export const useCustomerOrders = () => {
  return useQuery({
    queryKey: customerOrdersKeys.list(),
    queryFn: () => CustomerOrdersApi.getAll(),
  });
};

export const useCustomerOrder = (id: string) => {
  return useQuery({
    queryKey: customerOrdersKeys.detail(id),
    queryFn: () => CustomerOrdersApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateCustomerOrder = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("customer-orders");
  return useMutation({
    mutationFn: (input: CustomerOrderWrite) => CustomerOrdersApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerOrdersKeys.all });
      toastSuccess(t("toast.created"));
    },
  });
};

/** PUT /{id}/valider — stock exits happen server-side; stock queries are invalidated. */
export const useValidateCustomerOrder = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("customer-orders");
  return useMutation({
    mutationFn: CustomerOrdersApi.validate,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: customerOrdersKeys.all });
      queryClient.invalidateQueries({
        queryKey: customerOrdersKeys.detail(order.id),
      });
      // Server-side side effect: stock exits per line.
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toastSuccess(t("toast.validated"));
    },
  });
};

/**
 * PUT /{id}/expedier — VALIDEE → EXPEDIEE.
 * No stock side effect: the exits already happened at validation, shipping
 * only advances the fulfilment state.
 */
export const useShipCustomerOrder = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("customer-orders");
  return useMutation({
    mutationFn: CustomerOrdersApi.ship,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: customerOrdersKeys.all });
      queryClient.invalidateQueries({
        queryKey: customerOrdersKeys.detail(order.id),
      });
      toastSuccess(t("toast.shipped"));
    },
  });
};

/** PUT /{id}/livrer — EXPEDIEE → LIVREE, the terminal state. */
export const useDeliverCustomerOrder = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("customer-orders");
  return useMutation({
    mutationFn: CustomerOrdersApi.deliver,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: customerOrdersKeys.all });
      queryClient.invalidateQueries({
        queryKey: customerOrdersKeys.detail(order.id),
      });
      toastSuccess(t("toast.delivered"));
    },
  });
};

/** PUT /{id}/annuler — only while EN_COURS. */
export const useCancelCustomerOrder = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("customer-orders");
  return useMutation({
    mutationFn: CustomerOrdersApi.cancel,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: customerOrdersKeys.all });
      queryClient.invalidateQueries({
        queryKey: customerOrdersKeys.detail(order.id),
      });
      toastSuccess(t("toast.cancelled"));
    },
  });
};

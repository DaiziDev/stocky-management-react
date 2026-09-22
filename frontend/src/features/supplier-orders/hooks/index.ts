import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { SupplierOrdersApi } from "../api";
import { toastSuccess } from "@/lib/toast";
import type { PartialReceptionWrite, SupplierOrderWrite } from "../types";

/** Query-key factory — `all` covers orders + lifecycle side effects on detail queries. */
export const supplierOrdersKeys = {
  all: ["supplier-orders"] as const,
  list: () => [...supplierOrdersKeys.all, "list"] as const,
  detail: (id: string) => [...supplierOrdersKeys.all, "detail", id] as const,
};

export const useSupplierOrders = () => {
  return useQuery({
    queryKey: supplierOrdersKeys.list(),
    queryFn: () => SupplierOrdersApi.getAll(),
  });
};

export const useSupplierOrder = (id: string) => {
  return useQuery({
    queryKey: supplierOrdersKeys.detail(id),
    queryFn: () => SupplierOrdersApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateSupplierOrder = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("supplier-orders");
  return useMutation({
    mutationFn: (input: SupplierOrderWrite) => SupplierOrdersApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierOrdersKeys.all });
      toastSuccess(t("toast.created"));
    },
  });
};

/** PUT /{id}/receptionner — stock entries happen server-side; stock queries are invalidated. */
export const useReceiveSupplierOrder = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("supplier-orders");
  return useMutation({
    mutationFn: SupplierOrdersApi.receive,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: supplierOrdersKeys.all });
      queryClient.invalidateQueries({
        queryKey: supplierOrdersKeys.detail(order.id),
      });
      // Server-side side effect: stock entries per line.
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toastSuccess(t("toast.received"));
    },
  });
};

/**
 * PUT /{id}/receptionner-partiel — records what was actually delivered.
 * Same stock side effect as a full reception, for the received quantities
 * only, so stock and article queries are invalidated too.
 */
export const useReceivePartialSupplierOrder = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("supplier-orders");
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PartialReceptionWrite }) =>
      SupplierOrdersApi.receivePartial(id, data),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: supplierOrdersKeys.all });
      queryClient.invalidateQueries({
        queryKey: supplierOrdersKeys.detail(order.id),
      });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toastSuccess(t("toast.receivedPartial"));
    },
  });
};

/** PUT /{id}/annuler. */
export const useCancelSupplierOrder = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("supplier-orders");
  return useMutation({
    mutationFn: SupplierOrdersApi.cancel,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: supplierOrdersKeys.all });
      queryClient.invalidateQueries({
        queryKey: supplierOrdersKeys.detail(order.id),
      });
      toastSuccess(t("toast.cancelled"));
    },
  });
};

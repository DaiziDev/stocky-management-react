import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { StockApi } from "../api";
import { toastSuccess } from "@/lib/toast";
import type { StockAdjustmentInput, StockMovementType } from "../types";

/** Query-key factory — `all` is invalidated by order lifecycle side effects too. */
export const stockKeys = {
  all: ["stock"] as const,
  etat: () => [...stockKeys.all, "etat"] as const,
  alertes: () => [...stockKeys.all, "alertes"] as const,
  valorisation: () => [...stockKeys.all, "valorisation"] as const,
  movements: (filters?: { articleId?: string; type?: StockMovementType }) =>
    [...stockKeys.all, "movements", filters ?? {}] as const,
};

export const useStockEtat = () => {
  return useQuery({
    queryKey: stockKeys.etat(),
    queryFn: () => StockApi.getEtat(),
  });
};

export const useStockAlertes = () => {
  return useQuery({
    queryKey: stockKeys.alertes(),
    queryFn: () => StockApi.getAlertes(),
  });
};

export const useStockValorisation = () => {
  return useQuery({
    queryKey: stockKeys.valorisation(),
    queryFn: () => StockApi.getValorisation(),
  });
};

export const useStockMovements = (filters?: {
  articleId?: string;
  type?: StockMovementType;
}) => {
  return useQuery({
    queryKey: stockKeys.movements(filters),
    queryFn: () => StockApi.getMovements(filters),
  });
};

/** Manual inventory correction — refreshes every stock view (state, ledger, valuation, articles). */
export const useCreateStockAdjustment = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("stock");
  return useMutation({
    mutationFn: (input: StockAdjustmentInput) =>
      StockApi.createAdjustment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.all });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toastSuccess(t("toast.adjusted"));
    },
  });
};

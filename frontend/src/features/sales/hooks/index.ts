import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { SalesApi } from "../api";
import { toastSuccess } from "@/lib/toast";
import type { SaleWrite } from "../types";

/** Query-key factory — `all` covers list + detail; stock/articles are invalidated on checkout. */
export const salesKeys = {
  all: ["sales"] as const,
  list: () => [...salesKeys.all, "list"] as const,
  detail: (id: string) => [...salesKeys.all, "detail", id] as const,
};

export const useSales = () => {
  return useQuery({
    queryKey: salesKeys.list(),
    queryFn: () => SalesApi.getAll(),
  });
};

export const useSale = (id: string) => {
  return useQuery({
    queryKey: salesKeys.detail(id),
    queryFn: () => SalesApi.getById(id),
    enabled: !!id,
  });
};

/**
 * POST /api/ventes — checkout. The server decrements stock atomically and
 * refuses the whole sale (409) when any line lacks stock; stock, articles
 * and the movements ledger are refreshed here.
 */
export const useCheckoutSale = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("sales");
  return useMutation({
    mutationFn: (input: SaleWrite) => SalesApi.checkout(input),
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      // Server-side side effects: stock exits per line.
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toastSuccess(t("toast.created", { code: sale.code }));
    },
  });
};

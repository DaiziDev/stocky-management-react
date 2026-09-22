import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/Badge";
import type { OrderStatus } from "../types";

/**
 * Status → badge colour, following the fulfilment progression:
 * in-progress info · validated gold · shipped info · delivered success ·
 * cancelled danger.
 */
const STATUS_VARIANT = {
  EN_COURS: "info",
  VALIDEE: "gold",
  EXPEDIEE: "info",
  LIVREE: "success",
  ANNULEE: "danger",
} as const;

/**
 * Customer order status badge — covers the full
 * EN_COURS → VALIDEE → EXPEDIEE → LIVREE lifecycle plus ANNULEE, so lists and
 * detail headers render identically.
 */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation("customer-orders");
  return (
    <Badge variant={STATUS_VARIANT[status]}>{t(`status.${status}`)}</Badge>
  );
}

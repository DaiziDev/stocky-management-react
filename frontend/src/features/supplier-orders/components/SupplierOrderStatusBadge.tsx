import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/Badge";
import type { SupplierOrderStatus } from "../types";

/**
 * Status → badge colour: pending warning, partially received gold,
 * fully received success, cancelled danger.
 */
const STATUS_VARIANT = {
  EN_ATTENTE: "warning",
  RECUE_PARTIELLEMENT: "gold",
  RECUE: "success",
  ANNULEE: "danger",
} as const;

/**
 * Supplier order status badge — EN_ATTENTE / RECUE_PARTIELLEMENT / RECUE /
 * ANNULEE lifecycle.
 */
export function SupplierOrderStatusBadge({
  status,
}: {
  status: SupplierOrderStatus;
}) {
  const { t } = useTranslation("supplier-orders");
  return (
    <Badge variant={STATUS_VARIANT[status]}>{t(`status.${status}`)}</Badge>
  );
}

import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/Badge";
import type { StockRow } from "../types";

export type StockLevel = "OK" | "LOW" | "OUT";

/** Derive the stock level from current stock vs. min threshold. */
export function stockLevel(
  row: Pick<StockRow, "currentStock" | "minThreshold">,
): StockLevel {
  if (row.currentStock <= 0) return "OUT";
  if (row.minThreshold > 0 && row.currentStock <= row.minThreshold)
    return "LOW";
  return "OK";
}

const VARIANT = {
  OK: "success",
  LOW: "warning",
  OUT: "danger",
} as const;

/** Stock status badge (P5.1) — shared by the overview and alerts pages. */
export function StockStatusBadge({
  row,
}: {
  row: Pick<StockRow, "currentStock" | "minThreshold">;
}) {
  const { t } = useTranslation("stock");
  const level = stockLevel(row);
  return <Badge variant={VARIANT[level]}>{t(`status.${level}`)}</Badge>;
}

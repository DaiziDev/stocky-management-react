import { useTranslation } from "react-i18next";
import { BadgeCell } from "@/components/data-table";
import { formatStockStatus } from "@/lib/formatters";
import type { Article } from "../types";

/**
 * Stock-status badge shared by the articles list and details pages —
 * maps current stock vs min threshold to a translated, color-coded badge.
 */
export function StockStatusBadge({ article }: { article: Article }) {
  const { t } = useTranslation("articles");
  const status = formatStockStatus(article.currentStock, article.minStock);
  const label =
    status.variant === "danger"
      ? t("stock.out")
      : status.variant === "warning"
        ? t("stock.low")
        : t("stock.inStock");

  return <BadgeCell label={label} variant={status.variant} />;
}

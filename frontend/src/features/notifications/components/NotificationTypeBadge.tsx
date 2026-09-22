import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/Badge";

/**
 * Notification type badge (P6.3) — maps the backend's free-form `type`
 * label to a colored badge; unknown types fall back to a neutral badge.
 */
const TYPE_VARIANT: Record<string, "danger" | "warning" | "info" | "default"> =
  {
    STOCK_BAS: "warning",
    RUPTURE: "danger",
    ALERT: "info",
  };

export function NotificationTypeBadge({ type }: { type: string }) {
  const { t } = useTranslation("notifications");
  const known = type in TYPE_VARIANT;
  // Dynamic key → t() returns a union; labels are always strings in our JSONs.
  const label = known ? (t(`type.${type}`) as string) : type;
  return (
    <Badge variant={known ? TYPE_VARIANT[type] : "default"}>{label}</Badge>
  );
}

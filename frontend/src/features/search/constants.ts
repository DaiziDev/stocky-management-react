import {
  Package,
  User,
  Truck,
  ClipboardList,
  ClipboardCheck,
} from "lucide-react";
import type { SearchableEntity } from "./types";

/**
 * entity slug → `common:layout` label key ('customer-orders' →
 * 'entityCustomerOrders'). Labels resolve through i18n at render time
 * (GlobalSearch dropdown + SearchResultsPage) so search translates too.
 */
export function entityLabelKey(entity: SearchableEntity): string {
  return `layout.entity${entity
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`;
}

export const ENTITY_META: Record<SearchableEntity, { icon: typeof Package }> = {
  articles: { icon: Package },
  customers: { icon: User },
  suppliers: { icon: Truck },
  "customer-orders": { icon: ClipboardList },
  "supplier-orders": { icon: ClipboardCheck },
};

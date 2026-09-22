import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { Article } from "@/features/articles/types";
import type { Customer } from "@/features/customers/types";
import type { Supplier } from "@/features/suppliers/types";
import type { CustomerOrder } from "@/features/customer-orders/types";
import type { SupplierOrder } from "@/features/supplier-orders/types";
import type { SearchGroup, SearchableEntity } from "../types";

/**
 * Entity search — fans out to each list endpoint in parallel.
 * `Promise.allSettled` keeps a healthy entity's results when another endpoint
 * fails (partial-failure tolerance) instead of failing the whole page.
 *
 * Endpoints are the swagger-pinned French resources; the backend currently
 * accepts no `search` query param, so results are filtered client-side.
 * Mappers read the PINNED domain shapes from each feature folder — the old
 * common.types aspirational fields (name, code, orderNumber…) are gone.
 */
export const searchEntities = async (
  query: string,
  size = 10,
): Promise<{ groups: SearchGroup[]; totalHits: number }> => {
  const params = { size };

  const requests: Array<{
    entity: SearchableEntity;
    url: string;
    href: (id: string) => string;
    map: (item: never) => { title: string; subtitle?: string; meta?: string };
  }> = [
    {
      entity: "articles",
      url: API_ENDPOINTS.ARTICLES,
      href: (id) => `/catalog/articles/${id}`,
      map: (a: Article) => ({
        title: a.designation,
        subtitle: a.code,
        meta:
          [a.category?.designation, a.currentStock <= 0 ? "Rupture" : undefined]
            .filter(Boolean)
            .join(" · ") || undefined,
      }),
    },
    {
      entity: "customers",
      url: API_ENDPOINTS.CUSTOMERS,
      href: (id) => `/customers/${id}`,
      map: (c: Customer) => ({
        title: `${c.firstName} ${c.lastName}`,
        subtitle: c.email ?? undefined,
        meta: [c.city, c.phone].filter(Boolean).join(" · ") || undefined,
      }),
    },
    {
      entity: "suppliers",
      url: API_ENDPOINTS.SUPPLIERS,
      href: (id) => `/suppliers/${id}`,
      map: (s: Supplier) => ({
        title: s.name,
        subtitle: s.email ?? undefined,
        meta: [s.city, s.phone].filter(Boolean).join(" · ") || undefined,
      }),
    },
    {
      entity: "customer-orders",
      url: API_ENDPOINTS.CUSTOMER_ORDERS,
      href: (id) => `/customer-orders/${id}`,
      map: (o: CustomerOrder) => ({
        title: o.code,
        subtitle: o.customerName,
        meta: o.total > 0 ? formatCurrency(o.total) : undefined,
      }),
    },
    {
      entity: "supplier-orders",
      url: API_ENDPOINTS.SUPPLIER_ORDERS,
      href: (id) => `/supplier-orders/${id}`,
      map: (o: SupplierOrder) => ({
        title: o.code,
        subtitle: o.supplierName,
        meta: o.total > 0 ? formatCurrency(o.total) : undefined,
      }),
    },
  ];

  const settled = await Promise.allSettled(
    requests.map((request) =>
      apiClient.get<unknown[]>(request.url, { params }),
    ),
  );

  const groups: SearchGroup[] = settled.map((outcome, index) => {
    const request = requests[index];

    if (outcome.status === "rejected") {
      return {
        entity: request.entity,
        error: outcome.reason,
        total: 0,
        items: [],
      };
    }

    // Backend returns bare arrays (not paginated envelopes).
    const all = (
      Array.isArray(outcome.value.data) ? outcome.value.data : []
    ) as Array<Record<string, unknown>>;
    const needle = query.trim().toLowerCase();

    const content = (
      needle
        ? all.filter((item) =>
            Object.values(item).some(
              (value) =>
                typeof value === "string" &&
                value.toLowerCase().includes(needle),
            ),
          )
        : all
    ).slice(0, size);

    return {
      entity: request.entity,
      total: content.length,
      items: content.map((item: Record<string, unknown>) => {
        const { title, subtitle, meta } = request.map(item as never);
        return {
          id: String(item.id),
          title,
          subtitle,
          meta,
          href: request.href(String(item.id)),
        };
      }),
    };
  });

  return {
    groups,
    totalHits: groups.reduce((sum, group) => sum + group.items.length, 0),
  };
};

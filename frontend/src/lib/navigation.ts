import {
  LayoutDashboard,
  BarChart3,
  Tag,
  Package,
  Building2,
  Users,
  User,
  Truck,
  ClipboardList,
  ClipboardCheck,
  ArrowLeftRight,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "./permissions";

export interface NavItem {
  key: string;
  /** i18n key in the `common:layout` namespace (e.g. `navDashboard`). */
  labelKey: string;
  href: string;
  icon: LucideIcon;
  /** Restrict visibility to these roles; omit = visible to all authenticated users. */
  roles?: Role[];
  /** NavLink `end` — match only the exact path (needed for index pages). */
  end?: boolean;
}

export interface NavGroup {
  /** i18n key in the `common:layout` namespace (e.g. `groupOverview`). */
  labelKey: string;
  items: NavItem[];
}

/**
 * Grouped primary navigation — mirrors the mockup NAV structure
 * (Vue d'ensemble / Catalogue / Organisation / Tiers / Transactions).
 * Labels are i18n KEYS (resolved via `common:layout.<key>` by the Sidebar)
 * so the navigation translates with the language switcher. Hrefs stay
 * app-absolute (`/dashboard`) — the Sidebar prefixes them with langPath().
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "groupOverview",
    items: [
      {
        key: "dashboard",
        labelKey: "navDashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        end: true,
      },
      {
        key: "stock",
        labelKey: "navStockReports",
        href: "/stock",
        icon: BarChart3,
      },
    ],
  },
  {
    labelKey: "groupCatalog",
    items: [
      {
        key: "categories",
        labelKey: "navCategories",
        href: "/catalog/categories",
        icon: Tag,
        roles: ["ADMIN", "GESTIONNAIRE", "VENDEUR"],
      },
      {
        key: "articles",
        labelKey: "navArticles",
        href: "/catalog/articles",
        icon: Package,
      },
    ],
  },
  {
    labelKey: "groupOrganization",
    items: [
      // NOTE: «Entreprises» deliberately does NOT live here. A company ADMIN is
      // bound to exactly one tenant and must never create or browse others —
      // that is the SUPER_ADMIN's job, see PLATFORM_NAV_GROUPS below.
      {
        key: "users",
        labelKey: "navUsers",
        href: "/users",
        icon: Users,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    labelKey: "groupPartners",
    items: [
      {
        key: "customers",
        labelKey: "navCustomers",
        href: "/customers",
        icon: User,
      },
      {
        key: "suppliers",
        labelKey: "navSuppliers",
        href: "/suppliers",
        icon: Truck,
        roles: ["ADMIN", "GESTIONNAIRE"],
      },
    ],
  },
  {
    labelKey: "groupTransactions",
    items: [
      {
        key: "customer-orders",
        labelKey: "navCustomerOrders",
        href: "/customer-orders",
        icon: ClipboardList,
      },
      {
        key: "supplier-orders",
        labelKey: "navSupplierOrders",
        href: "/supplier-orders",
        icon: ClipboardCheck,
      },
      {
        key: "stock-movements",
        labelKey: "navStockMovements",
        href: "/stock/movements",
        icon: ArrowLeftRight,
      },
      {
        key: "sales",
        labelKey: "navSales",
        href: "/sales",
        icon: ShoppingCart,
      },
    ],
  },
];

/**
 * Platform console navigation — SUPER_ADMIN only.
 *
 * The platform operator owns no catalog, stock or sales: those belong to a
 * tenant. Their sidebar therefore replaces the whole app navigation rather
 * than extending it, which is why this is a separate list and not extra
 * role-gated entries inside NAV_GROUPS.
 */
export const PLATFORM_NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "groupPlatform",
    items: [
      {
        key: "platform-overview",
        labelKey: "navPlatformOverview",
        href: "/platform",
        icon: LayoutDashboard,
        end: true,
      },
      {
        key: "platform-companies",
        labelKey: "navPlatformCompanies",
        href: "/platform/companies",
        icon: Building2,
      },
    ],
  },
];

/** True when the user operates the platform instead of belonging to a tenant. */
export function isPlatformRole(roles: readonly string[] | undefined): boolean {
  return !!roles?.includes("SUPER_ADMIN");
}

/** The sidebar a user should see, decided solely by their role. */
export function navGroupsFor(roles: readonly string[] | undefined): NavGroup[] {
  return isPlatformRole(roles) ? PLATFORM_NAV_GROUPS : NAV_GROUPS;
}

/**
 * Where a user lands after login (and where "/" resolves to for them):
 * the platform console for a SUPER_ADMIN, the tenant dashboard for everyone
 * else. Paths are app-absolute — callers prefix them with langPath().
 */
export function landingPathFor(roles: readonly string[] | undefined): string {
  return isPlatformRole(roles) ? "/platform" : "/dashboard";
}

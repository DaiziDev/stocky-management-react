export const APP_NAME = "SGS";
export const APP_DESCRIPTION = "Système de Gestion de Stock";

/**
 * Backend endpoint paths — pinned to swagger.json (v1.0).
 * The axios baseURL already includes the `/api` prefix (VITE_API_URL),
 * so paths here omit it (e.g. `/clients` → GET {API_URL}/api/clients).
 * NOTE: the backend uses French resource names; do not "translate" them.
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    ME: "/auth/me",
    /** Exchanges a refresh token for a new pair (the old one is rotated out). */
    REFRESH: "/auth/refresh",
    /** Revokes a refresh token; idempotent. */
    LOGOUT: "/auth/logout",
  },
  /**
   * Platform console — SUPER_ADMIN only. `ONBOARD` creates the client company
   * AND its first ADMIN account in a single backend transaction.
   */
  PLATFORM: {
    STATS: "/plateforme/stats",
    ONBOARD: "/plateforme/entreprises",
  },
  COMPANIES: "/entreprises",
  COMPANY: (id: string) => `/entreprises/${id}`,
  USERS: "/utilisateurs",
  USER: (id: string) => `/utilisateurs/${id}`,
  CATEGORIES: "/categories",
  CATEGORY: (id: string) => `/categories/${id}`,
  ARTICLES: "/articles",
  ARTICLE: (id: string) => `/articles/${id}`,
  CUSTOMERS: "/clients",
  CUSTOMER: (id: string) => `/clients/${id}`,
  SUPPLIERS: "/fournisseurs",
  SUPPLIER: (id: string) => `/fournisseurs/${id}`,
  CUSTOMER_ORDERS: "/commandes-client",
  CUSTOMER_ORDER: (id: string) => `/commandes-client/${id}`,
  CUSTOMER_ORDER_VALIDATE: (id: string) => `/commandes-client/${id}/valider`,
  /** VALIDEE → EXPEDIEE. */
  CUSTOMER_ORDER_SHIP: (id: string) => `/commandes-client/${id}/expedier`,
  /** EXPEDIEE → LIVREE (terminal). */
  CUSTOMER_ORDER_DELIVER: (id: string) => `/commandes-client/${id}/livrer`,
  CUSTOMER_ORDER_CANCEL: (id: string) => `/commandes-client/${id}/annuler`,
  SUPPLIER_ORDERS: "/commandes-fournisseur",
  SUPPLIER_ORDER: (id: string) => `/commandes-fournisseur/${id}`,
  SUPPLIER_ORDER_RECEIVE: (id: string) =>
    `/commandes-fournisseur/${id}/receptionner`,
  /** Per-line received quantities; leaves the order RECUE_PARTIELLEMENT. */
  SUPPLIER_ORDER_RECEIVE_PARTIAL: (id: string) =>
    `/commandes-fournisseur/${id}/receptionner-partiel`,
  SUPPLIER_ORDER_CANCEL: (id: string) => `/commandes-fournisseur/${id}/annuler`,
  SALES: "/ventes",
  SALE: (id: string) => `/ventes/${id}`,
  STOCK: {
    /** Current stock state per article (read-only). */
    ETAT: "/stock/etat",
    /** Low-stock alerts (read-only). */
    ALERTS: "/stock/alertes",
    /** Aggregate stock valuation. */
    VALUATION: "/stock/valorisation",
    /** Stock movements ledger; supports `articleId` & `type` query params. */
    MOVEMENTS: "/mouvements-stock",
  },
  NOTIFICATIONS: "/notifications",
  DASHBOARD_KPIs: "/dashboard/kpis",
  /** Server-computed chart series (stock in/out per day + top articles). */
  DASHBOARD_CHARTS: "/dashboard/graphiques",
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  /** Rotated on every /auth/refresh — see api/client.ts. */
  REFRESH_TOKEN: "refresh_token",
  USER: "user",
  /** zustand persist key for the auth store (see stores/auth.store.ts). */
  AUTH_STORAGE: "auth-storage",
  THEME_MODE: "theme-mode",
  LANGUAGE: "i18nextLng",
} as const;

export const PAGINATION_DEFAULT_SIZE = 10;
export const PAGINATION_SIZES = [5, 10, 20, 50, 100];

export const DATE_FORMATS = {
  SHORT: "dd/MM/yyyy",
  LONG: "dd MMMM yyyy",
  DATETIME: "dd/MM/yyyy HH:mm",
  ISO: "yyyy-MM-dd",
} as const;

/**
 * Franc CFA (Central Africa) — the currency every amount in this app is
 * expressed in. `formatCurrency` defaults to it, so changing this one line
 * changes prices, totals, KPIs and the price inputs together.
 *
 * XAF is a ZERO-DECIMAL currency: Intl renders "706 664 FCFA", never
 * "706 664,00 FCFA". Nothing should force a fraction-digit count on it.
 */
export const CURRENCY = "XAF";
export const LOCALE = "fr-FR";

export const TOAST_DURATION = 4000;
export const DEBOUNCE_DELAY = 300;

/**
 * NOTE — no domain enums here. Status/movement/role types live pinned to
 * swagger.json with their features and are the single source of truth:
 *   - customer-orders/types `OrderStatus`
 *       = EN_COURS | VALIDEE | EXPEDIEE | LIVREE | ANNULEE
 *   - supplier-orders/types `SupplierOrderStatus`
 *       = EN_ATTENTE | RECUE_PARTIELLEMENT | RECUE | ANNULEE
 *   - stock/types `StockMovementType`   = ENTREE | SORTIE | AJUSTEMENT
 *   - auth/types `UserRole` + lib/permissions `ROLES`
 *       = SUPER_ADMIN | ADMIN | GESTIONNAIRE | VENDEUR
 * Do not reintroduce parallel enum lists (the old PENDING/SHIPPED/IN/OUT ones
 * never existed in the backend contract).
 */

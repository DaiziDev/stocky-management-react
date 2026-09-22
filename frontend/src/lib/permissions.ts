import { useAuthStore } from "@/stores/auth.store";

export const ROLES = {
  /** Platform operator — owns no company, onboards and manages the tenants. */
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  GESTIONNAIRE: "GESTIONNAIRE",
  VENDEUR: "VENDEUR",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  // Articles
  ARTICLE_CREATE: "article:create",
  ARTICLE_READ: "article:read",
  ARTICLE_UPDATE: "article:update",
  ARTICLE_DELETE: "article:delete",

  // Categories
  CATEGORY_CREATE: "category:create",
  CATEGORY_READ: "category:read",
  CATEGORY_UPDATE: "category:update",
  CATEGORY_DELETE: "category:delete",

  // Customers
  CUSTOMER_CREATE: "customer:create",
  CUSTOMER_READ: "customer:read",
  CUSTOMER_UPDATE: "customer:update",
  CUSTOMER_DELETE: "customer:delete",

  // Suppliers
  SUPPLIER_CREATE: "supplier:create",
  SUPPLIER_READ: "supplier:read",
  SUPPLIER_UPDATE: "supplier:update",
  SUPPLIER_DELETE: "supplier:delete",

  // Orders
  ORDER_CREATE: "order:create",
  ORDER_READ: "order:read",
  ORDER_UPDATE: "order:update",
  ORDER_DELETE: "order:delete",

  // Stock
  STOCK_READ: "stock:read",
  STOCK_UPDATE: "stock:update",
  STOCK_MOVEMENT_CREATE: "stock:movement:create",

  // Sales
  SALE_CREATE: "sale:create",
  SALE_READ: "sale:read",
  SALE_REPORT: "sale:report",

  // Users
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  // Companies
  COMPANY_CREATE: "company:create",
  COMPANY_READ: "company:read",
  COMPANY_UPDATE: "company:update",
  COMPANY_DELETE: "company:delete",

  // Dashboard
  DASHBOARD_VIEW: "dashboard:view",
  DASHBOARD_KPI: "dashboard:kpi",

  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  /**
   * Platform scope only: the SUPER_ADMIN onboards and manages client
   * companies, but owns no catalog, stock or sales of its own — those live
   * inside a tenant and are never reachable from the platform console.
   */
  SUPER_ADMIN: [
    PERMISSIONS.COMPANY_CREATE,
    PERMISSIONS.COMPANY_READ,
    PERMISSIONS.COMPANY_UPDATE,
    PERMISSIONS.COMPANY_DELETE,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_KPI,
  ],
  ADMIN: Object.values(PERMISSIONS),
  GESTIONNAIRE: [
    PERMISSIONS.ARTICLE_CREATE,
    PERMISSIONS.ARTICLE_READ,
    PERMISSIONS.ARTICLE_UPDATE,
    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.CATEGORY_UPDATE,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.SUPPLIER_CREATE,
    PERMISSIONS.SUPPLIER_READ,
    PERMISSIONS.SUPPLIER_UPDATE,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.STOCK_READ,
    PERMISSIONS.STOCK_UPDATE,
    PERMISSIONS.STOCK_MOVEMENT_CREATE,
    PERMISSIONS.SALE_CREATE,
    PERMISSIONS.SALE_READ,
    PERMISSIONS.SALE_REPORT,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_KPI,
    PERMISSIONS.SETTINGS_READ,
  ],
  VENDEUR: [
    PERMISSIONS.ARTICLE_READ,
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.SALE_CREATE,
    PERMISSIONS.SALE_READ,
    PERMISSIONS.DASHBOARD_VIEW,
  ],
};

export function hasPermission(permission: Permission): boolean {
  const { user } = useAuthStore.getState();
  if (!user) return false;

  return user.roles.some((role) => {
    const rolePermissions = ROLE_PERMISSIONS[role as Role] || [];
    return rolePermissions.includes(permission);
  });
}

export function hasAnyPermission(permissions: Permission[]): boolean {
  return permissions.some(hasPermission);
}

export function hasAllPermissions(permissions: Permission[]): boolean {
  return permissions.every(hasPermission);
}

export function hasRole(role: Role): boolean {
  const { user } = useAuthStore.getState();
  if (!user) return false;
  return user.roles.includes(role);
}

export function hasAnyRole(roles: Role[]): boolean {
  const { user } = useAuthStore.getState();
  if (!user) return false;
  return roles.some((role) => user.roles.includes(role));
}

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

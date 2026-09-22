import "i18next";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof import("./resources").globalResources.fr.common;
      auth: Record<string, string>;
      dashboard: Record<string, string>;
      platform: Record<string, string>;
      articles: Record<string, string>;
      customers: Record<string, string>;
      suppliers: Record<string, string>;
      "customer-orders": Record<string, string>;
      "supplier-orders": Record<string, string>;
      orders: Record<string, string>;
      stock: Record<string, string>;
      sales: Record<string, string>;
      notifications: Record<string, string>;
      users: Record<string, string>;
      companies: Record<string, string>;
      categories: Record<string, string>;
    };
  }
}

export type SupportedLanguage = "fr" | "en";
export type TranslationNamespace =
  | "common"
  | "auth"
  | "dashboard"
  | "platform"
  | "articles"
  | "customers"
  | "suppliers"
  | "customer-orders"
  | "supplier-orders"
  | "orders"
  | "stock"
  | "sales"
  | "notifications"
  | "users"
  | "companies"
  | "categories";

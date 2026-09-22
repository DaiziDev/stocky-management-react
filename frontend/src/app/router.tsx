import { lazy } from "react";
import { createBrowserRouter, Navigate, useLocation } from "react-router";
import { ProtectedRoute, RoleRoute, TenantRoute, LangGuard } from "@/routes";
import { useAuthStore } from "@/stores/auth.store";
import { landingPathFor } from "@/lib/navigation";
import { isAppLang } from "@/i18n";
import { legacyTarget } from "@/lib/lang-path";

const LoginPage = lazy(() =>
  import("@/features/auth/pages/LoginPage").then((m) => ({
    default: m.LoginPage,
  })),
);
const DashboardPage = lazy(() =>
  import("@/features/dashboard/pages/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const ArticlesPage = lazy(() =>
  import("@/features/articles/pages/ArticlesPage").then((m) => ({
    default: m.ArticlesPage,
  })),
);
const ArticleDetailsPage = lazy(() =>
  import("@/features/articles/pages/ArticleDetailsPage").then((m) => ({
    default: m.ArticleDetailsPage,
  })),
);
const CustomersPage = lazy(() =>
  import("@/features/customers/pages/CustomersPage").then((m) => ({
    default: m.CustomersPage,
  })),
);
const CustomerDetailsPage = lazy(() =>
  import("@/features/customers/pages/CustomerDetailsPage").then((m) => ({
    default: m.CustomerDetailsPage,
  })),
);
const SuppliersPage = lazy(() =>
  import("@/features/suppliers/pages/SuppliersPage").then((m) => ({
    default: m.SuppliersPage,
  })),
);
const SupplierDetailsPage = lazy(() =>
  import("@/features/suppliers/pages/SupplierDetailsPage").then((m) => ({
    default: m.SupplierDetailsPage,
  })),
);
const CustomerOrdersPage = lazy(() =>
  import("@/features/customer-orders/pages/CustomerOrdersPage").then((m) => ({
    default: m.CustomerOrdersPage,
  })),
);
const CustomerOrderDetailsPage = lazy(() =>
  import("@/features/customer-orders/pages/CustomerOrderDetailsPage").then(
    (m) => ({ default: m.CustomerOrderDetailsPage }),
  ),
);
const SupplierOrdersPage = lazy(() =>
  import("@/features/supplier-orders/pages/SupplierOrdersPage").then((m) => ({
    default: m.SupplierOrdersPage,
  })),
);
const SupplierOrderDetailsPage = lazy(() =>
  import("@/features/supplier-orders/pages/SupplierOrderDetailsPage").then(
    (m) => ({ default: m.SupplierOrderDetailsPage }),
  ),
);
const SalesPage = lazy(() =>
  import("@/features/sales/pages/SalesPage").then((m) => ({
    default: m.SalesPage,
  })),
);
const SaleDetailsPage = lazy(() =>
  import("@/features/sales/pages/SaleDetailsPage").then((m) => ({
    default: m.SaleDetailsPage,
  })),
);
const StockPage = lazy(() =>
  import("@/features/stock/pages/StockPage").then((m) => ({
    default: m.StockPage,
  })),
);
const StockMovementsPage = lazy(() =>
  import("@/features/stock/pages/StockMovementsPage").then((m) => ({
    default: m.StockMovementsPage,
  })),
);
const StockAlertsPage = lazy(() =>
  import("@/features/stock/pages/StockAlertsPage").then((m) => ({
    default: m.StockAlertsPage,
  })),
);
const NotificationsPage = lazy(() =>
  import("@/features/notifications/pages/NotificationsPage").then((m) => ({
    default: m.NotificationsPage,
  })),
);
const PlatformDashboardPage = lazy(() =>
  import("@/features/platform/pages/PlatformDashboardPage").then((m) => ({
    default: m.PlatformDashboardPage,
  })),
);
const PlatformCompaniesPage = lazy(() =>
  import("@/features/platform/pages/PlatformCompaniesPage").then((m) => ({
    default: m.PlatformCompaniesPage,
  })),
);
const PlatformOnboardingPage = lazy(() =>
  import("@/features/platform/pages/PlatformOnboardingPage").then((m) => ({
    default: m.PlatformOnboardingPage,
  })),
);
const PlatformCompanyDetailsPage = lazy(() =>
  import("@/features/platform/pages/PlatformCompanyDetailsPage").then((m) => ({
    default: m.PlatformCompanyDetailsPage,
  })),
);
const UsersPage = lazy(() =>
  import("@/features/users/pages/UsersPage").then((m) => ({
    default: m.UsersPage,
  })),
);
const UserDetailsPage = lazy(() =>
  import("@/features/users/pages/UserDetailsPage").then((m) => ({
    default: m.UserDetailsPage,
  })),
);
const CategoriesPage = lazy(() =>
  import("@/features/categories/pages/CategoriesPage").then((m) => ({
    default: m.CategoriesPage,
  })),
);
const CategoryDetailsPage = lazy(() =>
  import("@/features/categories/pages/CategoryDetailsPage").then((m) => ({
    default: m.CategoryDetailsPage,
  })),
);
const ProfilePage = lazy(() =>
  import("@/features/auth/pages/ProfilePage").then((m) => ({
    default: m.ProfilePage,
  })),
);
const SettingsPage = lazy(() =>
  import("@/features/auth/pages/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);
const SearchResultsPage = lazy(() =>
  import("@/features/search/pages/SearchResultsPage").then((m) => ({
    default: m.SearchResultsPage,
  })),
);
const NotFoundPage = lazy(() =>
  import("@/components/feedback/NotFoundPage").then((m) => ({
    default: m.NotFoundPage,
  })),
);
const ErrorPage = lazy(() =>
  import("@/components/feedback/ErrorPage").then((m) => ({
    default: m.ErrorPage,
  })),
);

const AppLayout = lazy(() =>
  import("@/components/layout/AppLayout").then((m) => ({
    default: m.AppLayout,
  })),
);

/**
 * Redirect "/" → "/{lang}" using the stored choice, else the browser
 * language, else French — preserving query string and hash.
 */
const RootRedirect = () => {
  const location = useLocation();
  return (
    <Navigate
      to={legacyTarget(location.pathname, location.search, location.hash)}
      replace
    />
  );
};

/**
 * Every route lives under /:lang (fr | en). LangGuard validates the segment,
 * syncs it into i18n, and redirects legacy unprefixed URLs (/login → /fr/login).
 */
/**
 * Catch-all: the `*` route only sees paths that matched neither `/` nor
 * `/:lang/…`. If the path is already language-prefixed it is genuinely
 * unknown → 404. Otherwise it is a legacy deep URL (/catalog/articles) →
 * redirect into the /:lang scheme (legacyTarget), which re-enters the router
 * normally; a still-unknown path then lands here AGAIN but prefixed, so the
 * 404 renders with no redirect loop.
 */
const LegacyOrNotFound = () => {
  const location = useLocation();
  const first = location.pathname.split("/")[1];
  if (isAppLang(first)) {
    return <NotFoundPage />;
  }
  return (
    <Navigate
      to={legacyTarget(location.pathname, location.search, location.hash)}
      replace
    />
  );
};

/**
 * Role-aware landing for "/{lang}": the platform operator goes to the
 * platform console, every company user to their tenant dashboard.
 */
const RoleLanding = () => {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={`.${landingPathFor(user?.roles)}`} replace />;
};

export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },
  {
    path: "/:lang",
    element: <LangGuard />,
    children: [
      { path: "login", element: <LoginPage /> },
      {
        element: <AppLayout />,
        errorElement: <ErrorPage />,
        children: [
          {
            element: <ProtectedRoute />,
            errorElement: <ErrorPage />,
            children: [
              { index: true, element: <RoleLanding /> },

              // ---- Platform console: SUPER_ADMIN only -------------------
              // A company ADMIN can no longer reach company management at
              // all — not in the sidebar, and not by typing the URL.
              {
                element: <RoleRoute allowedRoles={["SUPER_ADMIN"]} />,
                children: [
                  { path: "platform", element: <PlatformDashboardPage /> },
                  {
                    path: "platform/onboard",
                    element: <PlatformOnboardingPage />,
                  },
                  {
                    path: "platform/companies",
                    element: <PlatformCompaniesPage />,
                  },
                  {
                    path: "platform/companies/:id",
                    element: <PlatformCompanyDetailsPage />,
                  },
                ],
              },

              // ---- Tenant app: every company-scoped screen --------------
              // TenantRoute bounces a SUPER_ADMIN back to the console: they
              // belong to no company, so these pages have no data for them.
              {
                element: <TenantRoute />,
                children: [
                  { path: "dashboard", element: <DashboardPage /> },
                  {
                    element: <RoleRoute allowedRoles={["ADMIN"]} />,
                    children: [
                      { path: "users", element: <UsersPage /> },
                      { path: "users/:id", element: <UserDetailsPage /> },
                    ],
                  },
                  {
                    element: (
                      <RoleRoute
                        allowedRoles={["ADMIN", "GESTIONNAIRE", "VENDEUR"]}
                      />
                    ),
                    children: [
                      {
                        path: "catalog/categories",
                        element: <CategoriesPage />,
                      },
                      {
                        path: "catalog/categories/:id",
                        element: <CategoryDetailsPage />,
                      },
                    ],
                  },
                  { path: "catalog/articles", element: <ArticlesPage /> },
                  {
                    path: "catalog/articles/:id",
                    element: <ArticleDetailsPage />,
                  },
                  { path: "customers", element: <CustomersPage /> },
                  { path: "customers/:id", element: <CustomerDetailsPage /> },
                  {
                    element: (
                      <RoleRoute allowedRoles={["ADMIN", "GESTIONNAIRE"]} />
                    ),
                    children: [
                      { path: "suppliers", element: <SuppliersPage /> },
                      {
                        path: "suppliers/:id",
                        element: <SupplierDetailsPage />,
                      },
                    ],
                  },
                  { path: "customer-orders", element: <CustomerOrdersPage /> },
                  {
                    path: "customer-orders/:id",
                    element: <CustomerOrderDetailsPage />,
                  },
                  { path: "supplier-orders", element: <SupplierOrdersPage /> },
                  {
                    path: "supplier-orders/:id",
                    element: <SupplierOrderDetailsPage />,
                  },
                  { path: "sales", element: <SalesPage /> },
                  { path: "sales/:id", element: <SaleDetailsPage /> },
                  { path: "stock", element: <StockPage /> },
                  { path: "stock/movements", element: <StockMovementsPage /> },
                  { path: "stock/alerts", element: <StockAlertsPage /> },
                  { path: "search", element: <SearchResultsPage /> },
                ],
              },

              // ---- Shared by both worlds --------------------------------
              { path: "notifications", element: <NotificationsPage /> },
              { path: "profile", element: <ProfilePage /> },
              { path: "settings", element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <LegacyOrNotFound />,
  },
]);

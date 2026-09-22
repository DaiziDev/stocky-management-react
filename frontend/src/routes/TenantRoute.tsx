import { Navigate, Outlet } from "react-router";
import { langPath } from "@/lib/lang-path";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Keeps the platform operator out of tenant screens.
 *
 * A SUPER_ADMIN belongs to no company, so every company-scoped page (catalog,
 * stock, sales, customers…) would query a tenant they are not part of and
 * render empty or 403. Rather than showing a broken dashboard, send them back
 * to the platform console — the mirror image of `RoleRoute` guarding
 * /platform against company users.
 */
export const TenantRoute = () => {
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin());

  if (isSuperAdmin) {
    return <Navigate to={langPath("/platform")} replace />;
  }

  return <Outlet />;
};

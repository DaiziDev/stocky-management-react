import { Navigate, Outlet } from "react-router";
import { langPath } from "@/lib/lang-path";
import { useAuthStore } from "@/stores/auth.store";
import { landingPathFor } from "@/lib/navigation";
import type { UserRole } from "@/features/auth/types";

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

export const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
  const { user, hasRole } = useAuthStore();

  if (!user) {
    return <Navigate to={langPath("/login")} replace />;
  }

  const hasAccess = allowedRoles.some((role) => hasRole(role));

  if (!hasAccess) {
    // Bounce to the landing page of THIS user's world: a company user goes to
    // their dashboard, a SUPER_ADMIN back to the platform console. Hard-coding
    // /dashboard here would loop a SUPER_ADMIN through TenantRoute.
    return <Navigate to={langPath(landingPathFor(user.roles))} replace />;
  }

  return <Outlet />;
};

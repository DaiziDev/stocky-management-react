import { Navigate, Outlet, useLocation } from "react-router";
import { langPath } from "@/lib/lang-path";
import { useAuthStore } from "@/stores/auth.store";
import { useAuthBootstrap } from "@/features/auth/hooks/useAuthBootstrap";

/**
 * Session gate (P0.4) — resolves the session via /auth/me on first mount
 * before rendering any protected route, preventing both the stale-user hole
 * (persisted user with an expired token) and the redirect-to-login flash.
 */
export const ProtectedRoute = () => {
  useAuthBootstrap();
  const { isAuthenticated, isBootstrapping, hasBootstrapped } = useAuthStore();
  const location = useLocation();

  // Gate on hasBootstrapped too: on the very first render the bootstrap
  // effect has not run yet, so isBootstrapping is still false while
  // isAuthenticated is false — redirecting then would cancel the bootstrap
  // mid-flight (its result is discarded on unmount) and bounce a VALID
  // session to /login. "Not yet bootstrapped" must render as loading.
  if (isBootstrapping || !hasBootstrapped) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={langPath("/login")}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return <Outlet />;
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { authApi } from "../api";
import { useAuthStore } from "@/stores/auth.store";
import { langPath } from "@/lib/lang-path";
import { landingPathFor } from "@/lib/navigation";

/**
 * Auth hooks — login, logout and the current user.
 *
 * Landing after login is role-driven: a SUPER_ADMIN operates the platform and
 * goes to the platform console, everyone else goes to their tenant dashboard
 * (see `landingPathFor`). This is what makes the same login screen serve both
 * audiences without asking the user which one they are.
 */

export const useLogin = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (credentials: { login: string; motDePasse: string }) => {
      try {
        return await authApi.login(credentials);
      } catch (error) {
        // LoginPage surfaces login failures inline — flag as handled so the
        // global MutationCache doesn't double-toast. The ORIGINAL error object
        // is re-thrown untouched: axios rejections here are plain ApiError
        // objects (see client.ts normalizeError) whose `message` carries the
        // backend copy — wrapping them via String() would degrade it to
        // "[object Object]".
        throw Object.assign(
          error instanceof Object ? error : new Error(String(error)),
          { handled: true },
        );
      }
    },
    onSuccess: (user) => {
      setAuth(user);
      navigate(langPath(landingPathFor(user.roles)), { replace: true });
    },
  });
};

/**
 * Logout — revokes the refresh token server-side (POST /auth/logout), clears
 * the local session and wipes the query cache.
 *
 * Clearing the cache matters here: the next user to log in on this browser
 * may belong to a different company, and stale tenant data must never flash
 * on their screen before the refetch lands.
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      queryClient.clear();
      navigate(langPath("/login"), { replace: true });
    },
  });

  return {
    mutate: () => mutation.mutate(),
    isPending: mutation.isPending,
  };
};

/**
 * Profile data comes straight from the store (hydrated by /auth/me in
 * useAuthBootstrap and setAuth on login). No separate query needed until
 * a profile-update endpoint ships.
 */
export const useCurrentUser = () => {
  const user = useAuthStore((s) => s.user);
  return { user, isAuthenticated: !!user };
};

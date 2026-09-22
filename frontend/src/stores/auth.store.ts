import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser, UserRole } from "@/features/auth/types";

/**
 * Auth store (P0.4) — the user object only.
 *
 * Token storage is resolved: the JWT lives ONLY in localStorage
 * (`STORAGE_KEYS.ACCESS_TOKEN`), written by authApi.login and read by the
 * axios interceptor. The store never holds tokens, eliminating the old
 * dual-write (store persist + manual localStorage) that could drift.
 *
 * The user is persisted for instant UI hydration; /auth/me (see
 * useAuthBootstrap) is the source of truth and overwrites it on mount.
 */
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True while the /auth/me bootstrap is in flight on app mount. */
  isBootstrapping: boolean;
  /** True once the bootstrap has completed (success or failure). */
  hasBootstrapped: boolean;

  setUser: (user: AuthUser | null) => void;
  setBootstrapping: (isBootstrapping: boolean) => void;
  /** Convenience for login flows: set user + authenticated in one call. */
  setAuth: (user: AuthUser) => void;
  logout: () => void;

  hasRole: (role: UserRole) => boolean;
  /** Platform operator (no tenant) — drives the sidebar and landing route. */
  isSuperAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isBootstrapping: false,
      hasBootstrapped: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setBootstrapping: (isBootstrapping) => set({ isBootstrapping }),

      setAuth: (user) => set({ user, isAuthenticated: true }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isBootstrapping: false,
          hasBootstrapped: true,
        }),

      hasRole: (role) => get().user?.roles.includes(role) ?? false,

      isSuperAdmin: () => get().user?.roles.includes("SUPER_ADMIN") ?? false,
    }),
    {
      name: "auth-storage",
      // Only the user persists — auth flags are re-derived on bootstrap,
      // so a stale localStorage entry can never grant a fake session.
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

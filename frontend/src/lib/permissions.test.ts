import { describe, it, expect, beforeEach } from "vitest";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  getPermissionsForRole,
  PERMISSIONS,
} from "./permissions";
import { useAuthStore } from "@/stores/auth.store";
import type { AuthUser } from "@/features/auth/types";

function setUser(roles: string[]): void {
  useAuthStore.setState({
    user: {
      id: "1",
      login: "test.user",
      firstName: "Test",
      lastName: "User",
      roles: roles as AuthUser["roles"],
    },
    isAuthenticated: true,
  });
}

describe("permission helpers (reads the auth store)", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it("denies everything for an anonymous user", () => {
    expect(hasPermission(PERMISSIONS.ARTICLE_READ)).toBe(false);
    expect(hasRole("ADMIN")).toBe(false);
    expect(hasAnyRole(["ADMIN", "GESTIONNAIRE"])).toBe(false);
  });

  it("hasRole / hasAnyRole reflect the user roles", () => {
    setUser(["VENDEUR"]);
    expect(hasRole("VENDEUR")).toBe(true);
    expect(hasRole("ADMIN")).toBe(false);
    expect(hasAnyRole(["ADMIN", "GESTIONNAIRE"])).toBe(false);

    setUser(["GESTIONNAIRE"]);
    expect(hasAnyRole(["ADMIN", "GESTIONNAIRE"])).toBe(true);
  });

  it("ADMIN holds user-management permissions", () => {
    setUser(["ADMIN"]);
    expect(hasPermission(PERMISSIONS.USER_CREATE)).toBe(true);
    expect(hasPermission(PERMISSIONS.USER_DELETE)).toBe(true);
    expect(
      hasAllPermissions([PERMISSIONS.ARTICLE_CREATE, PERMISSIONS.SALE_CREATE]),
    ).toBe(true);
  });

  it("VENDEUR can read categories but cannot manage them or suppliers", () => {
    setUser(["VENDEUR"]);
    expect(hasPermission(PERMISSIONS.SALE_CREATE)).toBe(true);
    expect(hasPermission(PERMISSIONS.ARTICLE_READ)).toBe(true);
    expect(hasPermission(PERMISSIONS.SUPPLIER_READ)).toBe(false);
    expect(hasPermission(PERMISSIONS.CATEGORY_READ)).toBe(true);
    expect(hasPermission(PERMISSIONS.ARTICLE_CREATE)).toBe(false);
    expect(
      hasAnyPermission([PERMISSIONS.ARTICLE_DELETE, PERMISSIONS.USER_CREATE]),
    ).toBe(false);
  });

  it("GESTIONNAIRE cannot access users or companies", () => {
    setUser(["GESTIONNAIRE"]);
    expect(hasPermission(PERMISSIONS.USER_READ)).toBe(false);
    expect(hasPermission(PERMISSIONS.COMPANY_READ)).toBe(false);
    expect(hasPermission(PERMISSIONS.ARTICLE_DELETE)).toBe(false);
    expect(hasPermission(PERMISSIONS.CATEGORY_DELETE)).toBe(false);
    expect(hasPermission(PERMISSIONS.CUSTOMER_DELETE)).toBe(false);
    expect(hasPermission(PERMISSIONS.SUPPLIER_DELETE)).toBe(false);
  });

  it("VENDEUR can read and create customers but cannot edit or delete them", () => {
    setUser(["VENDEUR"]);
    expect(hasPermission(PERMISSIONS.CUSTOMER_READ)).toBe(true);
    expect(hasPermission(PERMISSIONS.CUSTOMER_CREATE)).toBe(true);
    expect(hasPermission(PERMISSIONS.CUSTOMER_UPDATE)).toBe(false);
    expect(hasPermission(PERMISSIONS.CUSTOMER_DELETE)).toBe(false);
  });

  it("getPermissionsForRole returns a non-empty set per role and [] for unknown", () => {
    expect(getPermissionsForRole("ADMIN").length).toBeGreaterThan(0);
    expect(getPermissionsForRole("VENDEUR").length).toBeGreaterThan(0);
    expect(getPermissionsForRole("UNKNOWN" as never)).toEqual([]);
  });
});

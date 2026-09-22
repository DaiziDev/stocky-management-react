import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { langPath } from "@/lib/lang-path";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { useLogout } from "@/features/auth/hooks";
import { navGroupsFor, landingPathFor } from "@/lib/navigation";
import { hasAnyRole } from "@/lib/permissions";
import { LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* Sidebar-only ink tints (panel is dark-ink in BOTH themes) — referenced via
   the --dark-* tokens so no hard-coded hexes live here:
   base text = dark-text-secondary · icon = dark-text-muted · hover text =
   dark-text-primary · group label = dark-primary · disabled = dark-text-disabled.
   Active = gold 15% wash + gold-400 icon + 3px gold-500 bar on the panel edge.

   Scrollbar policy (mockup §sidebar): the nav scrolls silently — no track,
   and a hairline 5px thumb that only appears while hovering the nav. */

export const Sidebar = () => {
  const { t } = useTranslation("common");
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const closeSidebar = useUIStore((s) => s.closeSidebar);
  const user = useAuthStore((s) => s.user);
  const { mutate: handleLogout } = useLogout();

  // Navigation/role labels are DATA keys (common:layout.<labelKey>) — typed
  // t() only accepts literal keys, so dynamic lookups go through this cast.
  const tDynamic = t as unknown as (
    key: string,
    options?: Record<string, unknown>,
  ) => string;

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Utilisateur";
  const roleLabel = user?.roles?.[0]
    ? tDynamic(`layout.role${roleKey(user.roles[0])}`)
    : undefined;

  // A SUPER_ADMIN gets the platform console navigation instead of the tenant
  // one — the two sidebars are disjoint, not additive.
  const navGroups = navGroupsFor(user?.roles);
  const homePath = landingPathFor(user?.roles);

  return (
    <>
      {/* Mobile overlay */}
      <div
        aria-hidden="true"
        onClick={closeSidebar}
        className={cn(
          "fixed inset-0 z-40 bg-[var(--dark-input)]/45 backdrop-blur-[2px] transition-opacity duration-300 nav:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        id="app-sidebar"
        aria-label={t("layout.mainNavigation")}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-primary-950 text-[var(--dark-text-secondary)]",
          "transition-transform duration-300 ease-out",
          "max-nav:-translate-x-full max-nav:shadow-xl",
          "nav:translate-x-0",
          !sidebarOpen &&
            "max-nav:-translate-x-full max-nav:pointer-events-none",
        )}
      >
        {/* Brand header */}
        <div className="flex h-[66px] shrink-0 items-center justify-between px-5">
          <NavLink
            to={langPath(homePath)}
            className="flex items-center gap-2.5"
            onClick={closeSidebar}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-accent-500 font-display text-[15px] font-bold text-primary-950">
              S
            </span>
            <span className="font-display text-[17px] font-bold tracking-wide text-white">
              SGS
              <span className="ml-1.5 hidden font-mono text-[9.5px] font-normal uppercase tracking-[0.14em] text-[var(--dark-text-muted)] sm:inline">
                {t("layout.brandSuffix")}
              </span>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-lg p-1.5 text-[var(--dark-text-muted)] transition-colors hover:bg-white/[0.08] hover:text-white nav:hidden"
            aria-label={t("layout.closeMenu")}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Grouped, role-filtered navigation */}
        <nav
          className="sb-nav flex-1 overflow-y-auto px-3 pb-4"
          aria-label={t("layout.mainNavigation")}
        >
          {navGroups.map((group) => {
            const items = group.items.filter(
              (item) => !item.roles || hasAnyRole(item.roles),
            );
            if (items.length === 0) return null;

            return (
              <div key={group.labelKey}>
                <p className="px-3 pb-[7px] pt-[17px] font-mono text-[10px] uppercase tracking-[0.13em] text-[var(--dark-primary)]">
                  {tDynamic(`layout.${group.labelKey}`)}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => (
                    <li key={item.key}>
                      <NavLink
                        to={langPath(item.href)}
                        end={item.end}
                        onClick={closeSidebar}
                        className={({ isActive }) =>
                          cn(
                            "group relative flex items-center gap-3 rounded-[9px] px-3 py-[9px] text-[13.6px] font-medium transition-colors",
                            isActive
                              ? "bg-accent-500/15 text-white"
                              : "text-[var(--dark-text-secondary)] hover:bg-white/[0.055] hover:text-white",
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {/* Active bar on the panel edge */}
                            <span
                              aria-hidden="true"
                              className={cn(
                                "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-accent-500 transition-opacity",
                                isActive ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <item.icon
                              aria-hidden="true"
                              className={cn(
                                "h-[17px] w-[17px] shrink-0 transition-colors",
                                isActive
                                  ? "text-accent-400"
                                  : "text-[var(--dark-text-muted)] group-hover:text-[var(--dark-text-secondary)]",
                              )}
                            />
                            <span className="truncate">
                              {tDynamic(`layout.${item.labelKey}`)}
                            </span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="shrink-0 border-t border-white/[0.07] p-3">
          <div className="flex items-center gap-3 rounded-[9px] px-2 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-[12.5px] font-bold text-primary-950">
              {fullName
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white">
                {fullName}
              </p>
              {roleLabel && (
                <p className="truncate text-[11px] text-[var(--dark-text-disabled)]">
                  {roleLabel}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-lg p-[7px] text-[var(--dark-text-disabled)] transition-colors hover:bg-white/[0.08] hover:text-white"
              aria-label={t("layout.logout")}
              title={t("layout.logout")}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

/**
 * Role → i18n key suffix: ADMIN → "Admin", GESTIONNAIRE → "Manager",
 * VENDEUR → "Seller", SUPER_ADMIN → "SuperAdmin" (the underscore would
 * otherwise leak into the key as `roleSuper_admin`).
 */
function roleKey(role: string): string {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join("");
}

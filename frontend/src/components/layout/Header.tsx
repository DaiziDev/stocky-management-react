import { Menu, Bell, LogOut, User, Settings, ChevronDown } from "lucide-react";
import { useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth.store";
import { useLogout } from "@/features/auth/hooks";
import { isPlatformRole } from "@/lib/navigation";
import { langPath } from "@/lib/lang-path";
import { useUIStore } from "@/stores/ui.store";
import { useNotifications } from "@/features/notifications/hooks";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { GlobalSearch } from "./GlobalSearch";
import { Avatar } from "@/components/ui/Avatar";

/* Mockup topbar (§topbar): 66px, blurred surface, 1px border, hamburger <900px.
   Control order = mockup: hamburger · search (left) · spacer · language ·
   theme · entreprise pill · bell · avatar menu.
   Role-filtered entries — VENDEUR only sees "Profil". */

export const Header = () => {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  const { mutate: handleLogout } = useLogout();

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Utilisateur";
  const canManage =
    user?.roles?.includes("ADMIN") || user?.roles?.includes("GESTIONNAIRE");
  const headerLabel = user?.companyName || fullName;

  // Global search and notifications both fan out to TENANT resources
  // (/articles, /clients, /commandes-*, /notifications). A SUPER_ADMIN
  // belongs to no tenant, so those controls would only produce 403s.
  const isPlatform = isPlatformRole(user?.roles);

  const roleNames: Record<string, string> = {
    SUPER_ADMIN: t("layout.roleSuperAdmin"),
    ADMIN: t("layout.roleAdmin"),
    GESTIONNAIRE: t("layout.roleManager"),
    VENDEUR: t("layout.roleSeller"),
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-[66px] border-b border-border bg-surface/85 backdrop-blur-[10px] nav:left-[264px]">
      <div className="flex h-full items-center gap-3.5 px-4 md:px-7">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-content-secondary transition-colors hover:bg-surface-hover nav:hidden"
          aria-label={t("layout.openMenu")}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Mockup `.tb-search`: pinned to the left of the topbar (after the
            hamburger), fixed max-width, spacer pushes controls right. */}
        {!isPlatform && (
          <div className="w-full max-w-full flex-1 min-w-0 sm:max-w-[420px] sm:flex-none">
            <GlobalSearch />
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeSwitcher />
          {!isPlatform && <NotificationBell />}

          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-[9px] p-1.5 transition-colors hover:bg-surface-hover"
              aria-haspopup="true"
            >
              <Avatar name={headerLabel} size="sm" />
              <span className="hidden max-w-[180px] min-w-0 text-left lg:block">
                <span className="block truncate text-[13px] font-medium text-content">
                  {headerLabel}
                </span>
              </span>
              <ChevronDown
                className="hidden h-4 w-4 text-content-muted sm:block"
                aria-hidden="true"
              />
            </button>

            <div className="invisible absolute right-0 top-full z-50 mt-2 w-56 translate-y-1 rounded-[14px] border border-border bg-surface py-1.5 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div className="border-b border-border px-4 py-2.5">
                <p className="truncate text-sm font-medium text-content">
                  {fullName}
                </p>
                <p className="truncate text-xs text-content-muted">
                  {user?.email}
                </p>
                {user?.companyName && (
                  <p className="mt-0.5 truncate text-xs font-medium text-accent-700 dark:text-accent-400">
                    {user.companyName}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate(langPath("/profile"))}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-[13.6px] text-content-secondary transition-colors hover:bg-surface-hover hover:text-content"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                {t("layout.profile")}
              </button>

              {canManage && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(langPath("/settings"))}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13.6px] text-content-secondary transition-colors hover:bg-surface-hover hover:text-content"
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    {t("layout.settings")}
                  </button>
                  <p className="px-4 pb-1.5 pt-1.5 font-mono text-[10px] uppercase tracking-[0.13em] text-content-muted">
                    {user?.roles
                      ?.map((role) => roleNames[role] ?? role)
                      .join(", ")}
                  </p>
                </>
              )}

              <hr className="my-1 border-border" />

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-[13.6px] text-danger-500 transition-colors hover:bg-danger-100/60 dark:hover:bg-danger-500/10"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {t("layout.logout")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

/** Header bell (P6.3) — live active-notification count + hover dropdown. */
function NotificationBell() {
  const { t } = useTranslation("common");
  const { data } = useNotifications();
  const notifications = data ?? [];
  const count = notifications.length;
  const recent = notifications.slice(0, 5);

  return (
    <div className="group relative">
      <Link
        to={langPath("/notifications")}
        className="relative flex h-9 w-9 items-center justify-center rounded-[9px] text-content-secondary transition-colors hover:bg-surface-hover"
        aria-label={t("layout.notificationsCount", { count })}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>

      {/* Hover dropdown of the last N active notifications (same pattern as the user menu). */}
      <div className="invisible absolute right-0 top-full z-50 mt-2 w-80 translate-y-1 rounded-[14px] border border-border bg-surface py-1.5 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <p className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-content-muted">
          {t("layout.notifications")}
        </p>
        {count === 0 ? (
          <p className="px-4 py-4 text-center text-[13px] text-content-muted">
            —
          </p>
        ) : (
          <ul className="max-h-64 overflow-y-auto">
            {recent.map((n) => (
              <li key={`${n.type}-${n.articleId ?? "x"}-${n.message}`}>
                <Link
                  to={
                    n.articleId
                      ? langPath(`/catalog/articles/${n.articleId}`)
                      : langPath("/notifications")
                  }
                  className="block px-4 py-2.5 transition-colors hover:bg-surface-hover"
                >
                  <p className="truncate text-[13px] font-medium text-content">
                    {n.message}
                  </p>
                  {n.articleDesignation && (
                    <p className="truncate text-xs text-content-muted">
                      {n.articleDesignation}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          to={langPath("/notifications")}
          className="block border-t border-border px-4 py-2 text-center text-xs font-medium text-primary hover:underline"
        >
          {t("seeAll")}
        </Link>
      </div>
    </div>
  );
}

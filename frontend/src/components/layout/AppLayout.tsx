import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useUIStore } from "@/stores/ui.store";

/**
 * App shell — fixed dark-ink sidebar (mockup §shell) + fixed topbar.
 * The sidebar is always visible ≥900px (`nav:` breakpoint); below that it is
 * off-canvas and slides in over a backdrop when `sidebarOpen` is true.
 */
export const AppLayout = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const { pathname } = useLocation();

  // Lock body scroll while the mobile sidebar is open.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const apply = () => {
      document.body.style.overflow = !mq.matches && sidebarOpen ? "hidden" : "";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  // Mockup `go()`: every view change scrolls back to the top.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="nav:pl-[264px]">
        <Header />
        {/* pt = topbar height (fixed), so content starts below it */}
        <main className="min-h-[calc(100vh-66px)] pt-[66px]">
          {/* Keyed by pathname so the mockup .view entrance replays per route */}
          <div
            key={pathname}
            className="view-enter mx-auto w-full max-w-[1600px] p-4 max-[420px]:p-3 max-[640px]:py-4 md:p-6 lg:p-8"
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

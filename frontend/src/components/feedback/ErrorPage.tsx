import { useTranslation } from "react-i18next";
import {
  Link,
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router";
import { Button } from "@/components/ui/Button";
import { langPath } from "@/lib/lang-path";
import { AlertOctagon, Home, RefreshCw } from "lucide-react";

/**
 * ErrorPage (P8) — the router-level error boundary (`errorElement`).
 * Catches render/loader crashes that redirect loops and 404s don't cover:
 * shows a branded message (with the router error when it's a response),
 * and offers reload / dashboard recovery actions.
 */
export const ErrorPage = () => {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const error = useRouteError();

  const detail = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : error instanceof Error
      ? error.message
      : null;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <AlertOctagon className="h-16 w-16 text-danger-500" aria-hidden="true" />

      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-content">
          {t("error.title", { defaultValue: "Une erreur est survenue" })}
        </h1>
        <p className="max-w-md text-sm text-content-muted">
          {t("error.hint", {
            defaultValue:
              "Une erreur inattendue s’est produite. Rechargez la page ou revenez au tableau de bord.",
          })}
        </p>
        {detail && (
          <p
            className="mx-auto max-w-md truncate rounded-sm bg-surface-secondary px-3 py-1.5 font-mono text-xs text-content-muted dark:bg-[color:var(--dark-surface-secondary)]"
            title={detail}
          >
            {detail}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" onClick={() => navigate(0)}>
          <RefreshCw className="h-4 w-4" />
          {t("error.reload", { defaultValue: "Recharger" })}
        </Button>
        <Link to={langPath("/dashboard")}>
          <Button>
            <Home className="h-4 w-4" />
            {t("error.dashboard", { defaultValue: "Tableau de bord" })}
          </Button>
        </Link>
      </div>
    </div>
  );
};

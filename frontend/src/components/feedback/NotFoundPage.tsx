import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/Button";
import { langPath } from "@/lib/lang-path";
import { Compass, Home, ArrowLeft } from "lucide-react";

/**
 * NotFoundPage (P8) — rendered by the router's `*` route.
 * Replaces the old silent redirect-to-dashboard so mistyped URLs are
 * explicit and recoverable (back / dashboard / search entry point).
 */
export const NotFoundPage = () => {
  const { t } = useTranslation("common");
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="relative">
        <Compass
          className="h-16 w-16 text-content-disabled"
          aria-hidden="true"
        />
        <span className="absolute -right-3 -top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-950">
          404
        </span>
      </div>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-content">
          {t("notFound.title", { defaultValue: "Page introuvable" })}
        </h1>
        <p className="max-w-md text-sm text-content-muted">
          {t("notFound.hint", {
            defaultValue:
              "Cette page n’existe pas ou a été déplacée. Vérifiez l’URL ou revenez en arrière.",
          })}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          {t("notFound.back", { defaultValue: "Retour" })}
        </Button>
        <Link to={langPath("/dashboard")}>
          <Button>
            <Home className="h-4 w-4" />
            {t("notFound.dashboard", { defaultValue: "Tableau de bord" })}
          </Button>
        </Link>
      </div>
    </div>
  );
};

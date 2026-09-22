import { useSearchParams, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronRight, SearchX, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Highlight } from "@/components/ui/Highlight";
import { ErrorState } from "@/components/feedback/FeedbackStates";
import { useEntitySearch } from "../hooks";
import { ENTITY_META, entityLabelKey } from "../constants";

const SkeletonGroup = () => (
  <Card>
    <CardContent className="space-y-4 py-5">
      <div className="h-3 w-24 animate-pulse rounded bg-surface-secondary" />
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-surface-secondary" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-surface-secondary" />
            <div className="h-3 w-1/5 animate-pulse rounded bg-surface-secondary" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

/**
 * Global search results — queries every searchable entity in parallel
 * (articles, clients, fournisseurs, commandes) and renders grouped results.
 * Endpoints that fail degrade to an inline warning; healthy groups still show.
 */
export const SearchResultsPage = () => {
  const { t } = useTranslation("common");
  // Entity labels are DATA keys (common:layout.entity*) — dynamic lookups cast.
  const tDynamic = t as unknown as (
    key: string,
    options?: Record<string, unknown>,
  ) => string;
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const { data, isPending, isError, refetch } = useEntitySearch(query);

  const hasQuery = query.length > 0;
  const resultGroups =
    data?.groups.filter((group) => group.items.length > 0) ?? [];
  const failedGroups = data?.groups.filter((group) => group.error) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11.5px] uppercase tracking-[0.13em] text-accent-600">
          Recherche
        </p>
        <h1 className="mt-1.5 text-2xl font-bold text-content">
          {hasQuery ? `Résultats pour « ${query} »` : "Recherche"}
        </h1>
        {data && hasQuery && (
          <p className="mt-1 text-sm text-content-muted">
            {data.totalHits > 0
              ? `${data.totalHits} résultat${data.totalHits > 1 ? "s" : ""} trouvé${data.totalHits > 1 ? "s" : ""}`
              : "Aucun résultat"}
          </p>
        )}
      </div>

      {/* Idle — no query yet */}
      {!hasQuery && (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt">
                <SearchX
                  className="h-6 w-6 text-content-disabled"
                  aria-hidden="true"
                />
              </div>
              <h2 className="text-lg font-semibold text-content">
                Saisissez un terme de recherche
              </h2>
              <p className="mt-1 max-w-sm text-content-muted">
                Utilisez la barre de recherche en haut de page pour retrouver
                articles, clients, fournisseurs et commandes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {hasQuery && isPending && (
        <div className="space-y-4">
          <SkeletonGroup />
          <SkeletonGroup />
        </div>
      )}

      {/* Total failure */}
      {hasQuery && isError && (
        <ErrorState
          title="La recherche a échoué"
          message="Une erreur est survenue lors de la recherche. Veuillez réessayer."
          onRetry={() => refetch()}
        />
      )}

      {/* Results */}
      {data && hasQuery && (
        <>
          {resultGroups.length === 0 && failedGroups.length === 0 && (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt">
                    <SearchX
                      className="h-6 w-6 text-content-disabled"
                      aria-hidden="true"
                    />
                  </div>
                  <h2 className="text-lg font-semibold text-content">
                    Aucun résultat
                  </h2>
                  <p className="mt-1 max-w-sm text-content-muted">
                    Aucune entité ne correspond à « {query} ». Vérifiez
                    l'orthographe ou essayez un terme plus général.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {resultGroups.map((group) => {
              const meta = ENTITY_META[group.entity];
              const Icon = meta.icon;

              return (
                <Card key={group.entity}>
                  <CardContent className="py-2">
                    <div className="flex items-center gap-2.5 py-3">
                      <Icon
                        className="h-4 w-4 text-accent-600"
                        aria-hidden="true"
                      />
                      <h2 className="font-mono text-[11px] uppercase tracking-[0.13em] text-content-secondary">
                        {tDynamic(entityLabelKey(group.entity))}
                      </h2>
                      <Badge variant="gold" size="sm">
                        {group.total}
                      </Badge>
                    </div>

                    <ul>
                      {group.items.map((item, index) => (
                        <li key={item.id}>
                          <Link
                            to={item.href}
                            className={`flex items-center gap-3 rounded-sm px-2 py-3 transition-colors hover:bg-surface-hover ${
                              index > 0 ? "border-t border-border" : ""
                            }`}
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-alt">
                              <Icon
                                className="h-4 w-4 text-content-secondary"
                                aria-hidden="true"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13.6px] font-medium text-content">
                                <Highlight text={item.title} query={query} />
                              </p>
                              {(item.subtitle || item.meta) && (
                                <p className="truncate text-xs text-content-muted">
                                  <Highlight
                                    text={[item.subtitle, item.meta]
                                      .filter(Boolean)
                                      .join(" · ")}
                                    query={query}
                                  />
                                </p>
                              )}
                            </div>
                            <ChevronRight
                              className="h-4 w-4 shrink-0 text-content-disabled"
                              aria-hidden="true"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}

            {failedGroups.map((group) => (
              <div
                key={group.entity}
                className="flex items-center gap-2.5 rounded-lg border border-warning-500/30 bg-warning-100 px-4 py-3 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-500"
                role="status"
              >
                <AlertTriangle
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                {tDynamic("layout.searchUnavailable", {
                  entity: tDynamic(entityLabelKey(group.entity)),
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

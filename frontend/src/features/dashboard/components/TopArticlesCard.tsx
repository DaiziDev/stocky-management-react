import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { PanelHead } from "./PanelHead";
import { useDashboardGraphs } from "../hooks";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import { langPath } from "@/lib/lang-path";

/**
 * «Meilleures ventes» — the `topArticles` series from
 * GET /api/dashboard/graphiques.
 *
 * A ranked list with a proportional bar rather than a chart: the interesting
 * comparison is each article against the best seller, which a bar width
 * conveys directly while keeping the article name readable and clickable.
 */
export const TopArticlesCard = () => {
  const { t } = useTranslation("dashboard");
  const { data, isPending } = useDashboardGraphs();

  const articles = (data?.topArticles ?? []).slice(0, 5);
  const best = Math.max(1, ...articles.map((article) => article.quantitySold));

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-xs sm:p-6">
      <PanelHead title={t("topArticles.title")} to="/catalog/articles" />

      {isPending ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="h-[54px] animate-pulse rounded-[11px] bg-surface-secondary"
            />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-content-muted">
          {t("topArticles.empty")}
        </p>
      ) : (
        <ol className="space-y-2">
          {articles.map((article, index) => (
            <li key={article.id || article.code}>
              <Link
                to={langPath(`/catalog/articles/${article.id}`)}
                className="flex items-center gap-3 rounded-[11px] px-[13px] py-[11px] transition-colors hover:bg-surface-hover"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-500/15 font-mono text-[11.5px] font-bold text-accent-600 dark:text-accent-400">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-content">
                    {article.designation || article.code}
                  </p>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-accent-500/15">
                    <div
                      className="h-full rounded-full bg-accent-500"
                      style={{
                        width: `${Math.round((article.quantitySold / best) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="font-mono text-[12.5px] font-bold text-content">
                    {t("topArticles.sold", {
                      count: article.quantitySold,
                      formatted: formatNumber(article.quantitySold),
                    })}
                  </p>
                  <p className="font-mono text-[11.5px] text-content-muted">
                    {formatCurrency(article.revenue, CURRENCY)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

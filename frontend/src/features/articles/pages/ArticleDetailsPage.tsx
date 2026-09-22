import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MonoCell, CurrencyCell } from "@/components/data-table";
import { Badge } from "@/components/ui/Badge";
import { useArticle, useUpdateArticle } from "../hooks";
import { useCategories } from "@/features/categories/hooks";
import { ArticlesSchema } from "../schemas";
import type { ArticlesFormData } from "../schemas";
import { ArticleFormFields } from "../components/ArticleFormFields";
import { StockStatusBadge } from "../components/StockStatusBadge";
import { FormDialog } from "@/components/forms/FormDialog";
import { hasAnyRole } from "@/lib/permissions";
import { ArrowLeft, Pencil, Package } from "lucide-react";

/**
 * ArticleDetailsPage (P3.1) — identity card for a single article:
 * header with back nav + edit action, info card (identity/pricing/stock),
 * stock status, and the shared edit dialog. Route: /catalog/articles/:id.
 */
export const ArticleDetailsPage = () => {
  const { t } = useTranslation("articles");
  const { id } = useParams<{ id: string }>();

  const [editOpen, setEditOpen] = useState(false);
  const canManage = hasAnyRole(["ADMIN", "GESTIONNAIRE"]);

  const articleQuery = useArticle(id ?? "");
  const categoriesQuery = useCategories();
  const updateArticle = useUpdateArticle();

  const article = articleQuery.data;

  const categoryOptions = useMemo(
    () =>
      (categoriesQuery.data ?? []).map((c) => ({
        value: c.id,
        label: c.designation,
      })),
    [categoriesQuery.data],
  );

  const handleSubmit = async (values: ArticlesFormData) => {
    if (!id) return;
    await updateArticle.mutateAsync({ id, data: values });
  };

  if (articleQuery.isLoading) {
    return (
      <div className="space-y-6">
        <DetailsHeader title={t("detailTitle")} />
        <Card>
          <CardContent className="py-12">
            <div className="mx-auto max-w-md space-y-3" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-5 animate-pulse rounded bg-surface-secondary dark:bg-[color:var(--dark-surface-secondary)]"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="space-y-6">
        <DetailsHeader title={t("detailTitle")} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Package
              className="h-10 w-10 text-content-disabled"
              aria-hidden="true"
            />
            <h2 className="text-lg font-medium text-content">
              {t("notFound", { defaultValue: "Article introuvable" })}
            </h2>
            <p className="text-sm text-content-muted">
              {t("notFoundHint", {
                defaultValue: "Il a peut-être été supprimé.",
              })}
            </p>
            <Link to="/catalog/articles">
              <Button variant="outline">
                {t("backToList", { defaultValue: "Retour à la liste" })}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DetailsHeader
        title={article.designation}
        code={article.code}
        actions={
          canManage ? (
            <Button variant="edit" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              {t("editTitle")}
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Identity card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {t("identityCard", { defaultValue: "Fiche d'identité" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <Detail label={t("fields.code")}>
                <MonoCell value={article.code} />
              </Detail>
              <Detail label={t("fields.designation")}>
                {article.designation}
              </Detail>
              <Detail label={t("fields.category")}>
                {article.category?.designation ?? "—"}
              </Detail>
              <Detail label={t("fields.unitPriceHt")}>
                <CurrencyCell value={article.unitPriceHt} />
              </Detail>
              <Detail label={t("fields.unitPriceTtc")}>
                <CurrencyCell value={article.unitPriceTtc} />
              </Detail>
              <Detail label={t("fields.vatRate")}>
                <span className="tabular-nums">
                  {(article.vatRate * 100).toFixed(1).replace(/\.0$/, "")} %
                </span>
              </Detail>
              {article.photo && (
                <Detail label={t("fields.photo")} className="sm:col-span-2">
                  <a
                    href={article.photo}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {article.photo}
                  </a>
                </Detail>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Stock card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("stockCard", { defaultValue: "Stock" })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-content-secondary">
                {t("stock.statusLabel", { defaultValue: "État" })}
              </span>
              <StockStatusBadge article={article} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-content-secondary">
                {t("fields.currentStock")}
              </span>
              <span className="text-2xl font-semibold tabular-nums text-content">
                {article.currentStock}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-content-secondary">
                {t("fields.minStock")}
              </span>
              <span className="tabular-nums text-content">
                {article.minStock}
              </span>
            </div>
            {article.minStock > 0 && (
              <div className="pt-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary dark:bg-[color:var(--dark-surface-secondary)]">
                  <div
                    className={
                      article.currentStock <= 0
                        ? "h-full bg-danger-500"
                        : article.currentStock <= article.minStock
                          ? "h-full bg-warning-500"
                          : "h-full bg-success-500"
                    }
                    style={{
                      width: `${Math.min(100, Math.round((article.currentStock / (article.minStock * 2)) * 100))}%`,
                    }}
                    role="progressbar"
                    aria-valuenow={article.currentStock}
                    aria-valuemin={0}
                    aria-valuemax={article.minStock * 2}
                    aria-label={t("fields.currentStock")}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit dialog — same schema + shared fields body as the list page */}
      <FormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("editTitle")}
        schema={ArticlesSchema}
        defaultValues={{
          code: article.code,
          designation: article.designation,
          unitPriceHt: article.unitPriceHt,
          vatRate: article.vatRate,
          photo: article.photo,
          minStock: article.minStock,
          categoryId: article.category?.id ?? "",
        }}
        onSubmit={handleSubmit}
      >
        {({ control }) => (
          <ArticleFormFields
            control={control}
            categoryOptions={categoryOptions}
          />
        )}
      </FormDialog>
    </div>
  );
};

/** Page header: back link, title, optional code chip and actions. */
function DetailsHeader({
  title,
  code,
  actions,
}: {
  title: string;
  code?: string;
  actions?: React.ReactNode;
}) {
  const { t } = useTranslation("articles");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link
          to="/catalog/articles"
          className="rounded-[9px] p-2 text-content-secondary transition-colors hover:bg-surface-hover hover:text-content"
          aria-label={t("backToList", { defaultValue: "Retour à la liste" })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-content">{title}</h1>
          {code && (
            <Badge variant="secondary" className="mt-1 font-mono">
              {code}
            </Badge>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Definition-list row helper. */
function Detail({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-sm text-content-secondary">{label}</dt>
      <dd className="mt-0.5 text-content">{children}</dd>
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ArrowLeft, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MonoCell } from "@/components/data-table";
import { useCategory } from "../hooks";

export const CategoryDetailsPage = () => {
  const { t } = useTranslation("categories");
  const { id } = useParams<{ id: string }>();
  const categoryQuery = useCategory(id ?? "");
  const category = categoryQuery.data;

  if (categoryQuery.isLoading) {
    return (
      <div className="space-y-6">
        <DetailsHeader title={t("detailTitle")} />
        <Card>
          <CardContent className="py-12">
            <div className="mx-auto max-w-md space-y-3" aria-hidden="true">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="h-5 animate-pulse rounded bg-surface-secondary dark:bg-[color:var(--dark-surface-secondary)]"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <DetailsHeader title={t("detailTitle")} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Tag
              className="h-10 w-10 text-content-disabled"
              aria-hidden="true"
            />
            <h2 className="text-lg font-medium text-content">
              {t("notFound")}
            </h2>
            <p className="text-sm text-content-muted">{t("notFoundHint")}</p>
            <Link to="/catalog/categories">
              <Button variant="outline">{t("backToList")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DetailsHeader title={category.designation} />
      <Card>
        <CardHeader>
          <CardTitle>{t("identityCard")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <Detail label={t("fields.code")}>
              <MonoCell value={category.code} />
            </Detail>
            <Detail label={t("fields.designation")}>
              {category.designation}
            </Detail>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};

function DetailsHeader({ title }: { title: string }) {
  const { t } = useTranslation("categories");
  return (
    <div className="flex items-center gap-3">
      <Link
        to="/catalog/categories"
        className="rounded-[9px] p-2 text-content-secondary transition-colors hover:bg-surface-hover hover:text-content"
        aria-label={t("backToList")}
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="text-2xl font-bold text-content">{title}</h1>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-sm text-content-secondary">{label}</dt>
      <dd className="mt-0.5 text-content">{children}</dd>
    </div>
  );
}

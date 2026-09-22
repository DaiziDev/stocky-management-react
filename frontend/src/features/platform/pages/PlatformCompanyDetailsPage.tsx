import { Building2, Mail, MapPin, Phone, Users } from "lucide-react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useCompany } from "@/features/companies/hooks";
import { countryName, toIsoCountry } from "@/lib/countries";
import { langPath } from "@/lib/lang-path";

export const PlatformCompanyDetailsPage = () => {
  const { t, i18n } = useTranslation("companies");
  const { id } = useParams<{ id: string }>();
  const companyQuery = useCompany(id ?? "");
  const company = companyQuery.data;

  if (companyQuery.isLoading) {
    return (
      <div className="space-y-6">
        <DetailsHeader title={t("detailTitle")} />
        <Card>
          <CardContent className="space-y-3 py-12">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-5 animate-pulse rounded bg-surface-secondary dark:bg-[color:var(--dark-surface-secondary)]"
              />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <DetailsHeader title={t("detailTitle")} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Building2
              className="h-10 w-10 text-content-disabled"
              aria-hidden="true"
            />
            <h2 className="text-lg font-medium text-content">
              {t("notFound", { defaultValue: "Entreprise introuvable" })}
            </h2>
            <p className="text-sm text-content-muted">
              {t("notFoundHint", {
                defaultValue: "Elle a peut-être été supprimée.",
              })}
            </p>
            <Link to={langPath("/platform/companies")}>
              <Button variant="outline">
                {t("backToList", { defaultValue: "Retour aux entreprises" })}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const iso = toIsoCountry(company.country);
  const country = iso ? countryName(iso, i18n.language) : company.country;

  return (
    <div className="space-y-6">
      <DetailsHeader title={company.name} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {t("detail.identity", {
                defaultValue: "Informations de l'entreprise",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <Detail label={t("fields.name")}>
                <span className="font-medium">{company.name}</span>
              </Detail>
              <Detail label={t("fields.country")}>{country || "—"}</Detail>
              <Detail label={t("fields.addressLine1")}>
                {company.addressLine1 || "—"}
              </Detail>
              <Detail label={t("fields.addressLine2")}>
                {company.addressLine2 || "—"}
              </Detail>
              <Detail label={t("fields.city")}>{company.city || "—"}</Detail>
              <Detail label={t("fields.email")}>
                {company.email ? (
                  <a
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                    href={`mailto:${company.email}`}
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    {company.email}
                  </a>
                ) : (
                  "—"
                )}
              </Detail>
              <Detail label={t("fields.phone")}>
                {company.phone ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone
                      className="h-4 w-4 text-content-muted"
                      aria-hidden="true"
                    />
                    {company.phone}
                  </span>
                ) : (
                  "—"
                )}
              </Detail>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("detail.summary", { defaultValue: "Résumé" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-surface-secondary p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-950 text-accent-400">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-content">
                  {company.name}
                </p>
                <p className="text-xs text-content-muted">
                  {t("detail.clientCompany", {
                    defaultValue: "Entreprise cliente",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-content-secondary">
                <Users className="h-4 w-4" aria-hidden="true" />
                {t("fields.userCount")}
              </span>
              <Badge variant="secondary" size="sm">
                {company.userCount}
              </Badge>
            </div>
            {company.city && (
              <div className="flex items-center gap-2 text-sm text-content-muted">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                {company.city}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function DetailsHeader({ title }: { title: string }) {
  const { t } = useTranslation("companies");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        to={langPath("/platform/companies")}
        className="rounded-[9px] p-2 text-content-secondary transition-colors hover:bg-surface-hover hover:text-content"
        aria-label={t("backToList", { defaultValue: "Retour aux entreprises" })}
      >
        <span aria-hidden="true">←</span>
      </Link>
      <div>
        <p className="font-mono text-[11.5px] uppercase tracking-[0.13em] text-accent-600">
          {t("detailTitle")}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-content sm:text-3xl">
          {title}
        </h1>
      </div>
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
      <dd className="mt-1 text-content">{children}</dd>
    </div>
  );
}

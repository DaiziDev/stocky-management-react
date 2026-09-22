import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ArrowLeft, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MonoCell } from "@/components/data-table";
import { useUser } from "../hooks";

const ROLE_VARIANT = {
  SUPER_ADMIN: "danger",
  ADMIN: "gold",
  GESTIONNAIRE: "info",
  VENDEUR: "secondary",
} as const;

export const UserDetailsPage = () => {
  const { t } = useTranslation("users");
  const { id } = useParams<{ id: string }>();
  const userQuery = useUser(id ?? "");
  const user = userQuery.data;

  if (userQuery.isLoading) {
    return (
      <div className="space-y-6">
        <DetailsHeader title={t("detailTitle")} />
        <Card>
          <CardContent className="py-12">
            <div className="mx-auto max-w-md space-y-3" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => (
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

  if (!user) {
    return (
      <div className="space-y-6">
        <DetailsHeader title={t("detailTitle")} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <UserRound
              className="h-10 w-10 text-content-disabled"
              aria-hidden="true"
            />
            <h2 className="text-lg font-medium text-content">
              {t("notFound")}
            </h2>
            <p className="text-sm text-content-muted">{t("notFoundHint")}</p>
            <Link to="/users">
              <Button variant="outline">{t("backToList")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DetailsHeader title={`${user.firstName} ${user.lastName}`} />
      <Card>
        <CardHeader>
          <CardTitle>{t("identityCard")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <Detail label={t("fields.firstName")}>{user.firstName}</Detail>
            <Detail label={t("fields.lastName")}>{user.lastName}</Detail>
            <Detail label={t("fields.login")}>
              <MonoCell value={user.login} />
            </Detail>
            <Detail label={t("fields.role")}>
              <Badge variant={ROLE_VARIANT[user.role]}>
                {t(`role.${user.role}`)}
              </Badge>
            </Detail>
            <Detail label={t("fields.email")}>
              {user.email ? (
                <a
                  href={`mailto:${user.email}`}
                  className="text-primary hover:underline"
                >
                  {user.email}
                </a>
              ) : (
                "—"
              )}
            </Detail>
            <Detail label={t("fields.phone")}>
              {user.phone ? <MonoCell value={user.phone} /> : "—"}
            </Detail>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};

function DetailsHeader({ title }: { title: string }) {
  const { t } = useTranslation("users");
  return (
    <div className="flex items-center gap-3">
      <Link
        to="/users"
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

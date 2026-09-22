import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toLocationDefaults } from "@/lib/countries";
import { useParams, Link } from "react-router";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MonoCell } from "@/components/data-table";
import { Avatar } from "@/components/ui/Avatar";
import { useCustomer, useUpdateCustomer } from "../hooks";
import { CustomersSchema } from "../schemas";
import type { CustomersFormData } from "../schemas";
import { CustomerFormFields } from "../components/CustomerFormFields";
import { FormDialog } from "@/components/forms/FormDialog";
import { hasAnyRole } from "@/lib/permissions";
import { ArrowLeft, Pencil, UserRound } from "lucide-react";

/**
 * CustomerDetailsPage (P4.1) — full card for a single customer:
 * header with back nav + edit action, avatar, identity/contact card and
 * address card, plus the shared edit dialog (same schema + form body as the
 * list page). Route: /customers/:id. Order history lands here in P4.2.
 */
export const CustomerDetailsPage = () => {
  const { t } = useTranslation("customers");
  const { id } = useParams<{ id: string }>();

  const [editOpen, setEditOpen] = useState(false);
  const canManage = hasAnyRole(["ADMIN", "GESTIONNAIRE"]);

  const customerQuery = useCustomer(id ?? "");
  const updateCustomer = useUpdateCustomer();

  const customer = customerQuery.data;

  const handleSubmit = async (values: CustomersFormData) => {
    if (!id) return;
    await updateCustomer.mutateAsync({ id, data: values });
  };

  if (customerQuery.isLoading) {
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

  if (!customer) {
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
            <Link to="/customers">
              <Button variant="outline">{t("backToList")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DetailsHeader
        title={`${customer.firstName} ${customer.lastName}`}
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
        {/* Identity + contact card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("identityCard")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar
                name={`${customer.firstName} ${customer.lastName}`}
                size="md"
                className="h-14 w-14 !text-lg"
              />
              <dl className="grid flex-1 grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <Detail label={t("fields.lastName")}>
                  {customer.lastName}
                </Detail>
                <Detail label={t("fields.firstName")}>
                  {customer.firstName}
                </Detail>
                <Detail label={t("fields.phone")}>
                  {customer.phone ? <MonoCell value={customer.phone} /> : "—"}
                </Detail>
                <Detail label={t("fields.email")}>
                  {customer.email ? (
                    <a
                      href={`mailto:${customer.email}`}
                      className="text-primary hover:underline"
                    >
                      {customer.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </Detail>
              </dl>
            </div>
          </CardContent>
        </Card>

        {/* Address card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("addressCard")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-content">
            {customer.addressLine1 && <p>{customer.addressLine1}</p>}
            {customer.addressLine2 && <p>{customer.addressLine2}</p>}
            {(customer.postalCode || customer.city) && (
              <p>
                {customer.postalCode ? `${customer.postalCode} ` : ""}
                {customer.city}
              </p>
            )}
            {customer.country && <p>{customer.country}</p>}
            {!customer.addressLine1 &&
              !customer.addressLine2 &&
              !customer.postalCode &&
              !customer.city &&
              !customer.country && <p className="text-content-muted">—</p>}
          </CardContent>
        </Card>
      </div>

      {/* Edit dialog — same schema + shared fields body as the list page */}
      <FormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("editTitle")}
        schema={CustomersSchema}
        defaultValues={{
          lastName: customer.lastName,
          firstName: customer.firstName,
          addressLine1: customer.addressLine1 ?? "",
          addressLine2: customer.addressLine2 ?? "",
          city: customer.city ?? "",
          postalCode: customer.postalCode ?? "",
          ...toLocationDefaults(customer.country, customer.phone),
          email: customer.email ?? "",
          photo: customer.photo ?? "",
        }}
        onSubmit={handleSubmit}
      >
        {({ control }) => <CustomerFormFields control={control} />}
      </FormDialog>
    </div>
  );
};

/** Page header: back link, title and actions. */
function DetailsHeader({
  title,
  actions,
}: {
  title: string;
  actions?: React.ReactNode;
}) {
  const { t } = useTranslation("customers");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link
          to="/customers"
          className="rounded-[9px] p-2 text-content-secondary transition-colors hover:bg-surface-hover hover:text-content"
          aria-label={t("backToList")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-content">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Definition-list row helper. */
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

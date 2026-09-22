import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toLocationDefaults } from "@/lib/countries";
import { useParams, Link } from "react-router";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MonoCell } from "@/components/data-table";
import { useSupplier, useUpdateSupplier } from "../hooks";
import { SuppliersSchema } from "../schemas";
import type { SuppliersFormData } from "../schemas";
import { SupplierFormFields } from "../components/SupplierFormFields";
import { FormDialog } from "@/components/forms/FormDialog";
import { hasAnyRole } from "@/lib/permissions";
import { ArrowLeft, Pencil, Truck } from "lucide-react";

/**
 * SupplierDetailsPage (P3.4) — full card for a single supplier:
 * header with back nav + edit action, identity / contact / address cards,
 * and the shared edit dialog (same schema + form body as the list page).
 * Route: /suppliers/:id.
 */
export const SupplierDetailsPage = () => {
  const { t } = useTranslation("suppliers");
  const { id } = useParams<{ id: string }>();

  const [editOpen, setEditOpen] = useState(false);
  const canManage = hasAnyRole(["ADMIN", "GESTIONNAIRE"]);

  const supplierQuery = useSupplier(id ?? "");
  const updateSupplier = useUpdateSupplier();

  const supplier = supplierQuery.data;

  const handleSubmit = async (values: SuppliersFormData) => {
    if (!id) return;
    await updateSupplier.mutateAsync({ id, data: values });
  };

  if (supplierQuery.isLoading) {
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

  if (!supplier) {
    return (
      <div className="space-y-6">
        <DetailsHeader title={t("detailTitle")} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Truck
              className="h-10 w-10 text-content-disabled"
              aria-hidden="true"
            />
            <h2 className="text-lg font-medium text-content">
              {t("notFound")}
            </h2>
            <p className="text-sm text-content-muted">{t("notFoundHint")}</p>
            <Link to="/suppliers">
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
        title={supplier.name}
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
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <Detail label={t("fields.name")}>{supplier.name}</Detail>
              <Detail label={t("fields.phone")}>
                {supplier.phone ? <MonoCell value={supplier.phone} /> : "—"}
              </Detail>
              <Detail label={t("fields.email")}>
                {supplier.email ? (
                  <a
                    href={`mailto:${supplier.email}`}
                    className="text-primary hover:underline"
                  >
                    {supplier.email}
                  </a>
                ) : (
                  "—"
                )}
              </Detail>
            </dl>
          </CardContent>
        </Card>

        {/* Address card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("addressCard")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-content">
            {supplier.addressLine1 && <p>{supplier.addressLine1}</p>}
            {supplier.addressLine2 && <p>{supplier.addressLine2}</p>}
            {(supplier.postalCode || supplier.city) && (
              <p>
                {supplier.postalCode ? `${supplier.postalCode} ` : ""}
                {supplier.city}
              </p>
            )}
            {supplier.country && <p>{supplier.country}</p>}
            {!supplier.addressLine1 &&
              !supplier.addressLine2 &&
              !supplier.postalCode &&
              !supplier.city &&
              !supplier.country && <p className="text-content-muted">—</p>}
          </CardContent>
        </Card>
      </div>

      {/* Edit dialog — same schema + shared fields body as the list page */}
      <FormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("editTitle")}
        schema={SuppliersSchema}
        defaultValues={{
          name: supplier.name,
          addressLine1: supplier.addressLine1 ?? "",
          addressLine2: supplier.addressLine2 ?? "",
          city: supplier.city ?? "",
          postalCode: supplier.postalCode ?? "",
          ...toLocationDefaults(supplier.country, supplier.phone),
          email: supplier.email ?? "",
        }}
        onSubmit={handleSubmit}
      >
        {({ control }) => <SupplierFormFields control={control} />}
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
  const { t } = useTranslation("suppliers");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link
          to="/suppliers"
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

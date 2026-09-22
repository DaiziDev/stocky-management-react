import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  DataTable,
  DataTableToolbar,
  createDataTableColumns,
  MonoCell,
} from "@/components/data-table";
import { FormDialog } from "@/components/forms/FormDialog";
import { ConfirmDialog } from "@/components/forms/ConfirmDialog";
import { FormField } from "@/components/forms/FormFields";
import {
  CityField,
  CountryField,
  PhoneField,
} from "@/components/forms/LocationFields";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { hasRole } from "@/lib/permissions";
import {
  countryName,
  fromE164,
  toIsoCountry,
  DEFAULT_COUNTRY,
} from "@/lib/countries";
import {
  useCompanies,
  useUpdateCompany,
  useDeleteCompany,
} from "@/features/companies/hooks";
import {
  CompanyContactSchema,
  type CompanyContactFormData,
} from "@/features/companies/schemas";
import type { Company } from "@/features/companies/types";
import { langPath } from "@/lib/lang-path";

/**
 * «Entreprises clientes» — the SUPER_ADMIN's tenant list.
 *
 * Creating goes through the onboarding dialog (company + first ADMIN in one
 * transaction). Editing covers contact details only: swagger states the name
 * is the tenant partitioning key and is not editable, so it is shown
 * read-only in the edit dialog rather than silently dropped from the payload.
 *
 * The route is already wrapped in a SUPER_ADMIN RoleRoute; the in-page role
 * re-check below is deep-link defense, matching the pattern used by the other
 * admin modules.
 */
export const PlatformCompaniesPage = () => {
  const { t, i18n } = useTranslation("platform");
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState<Company | null>(null);

  const isSuperAdmin = hasRole("SUPER_ADMIN");

  const listQuery = useCompanies();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  const columns = useMemo(() => {
    const helper = createDataTableColumns<Company>();
    return [
      helper.accessor("name", {
        header: t("fields.companyName"),
        cell: (info) => (
          <span className="font-medium text-content">{info.getValue()}</span>
        ),
      }),
      helper.accessor("city", {
        header: t("fields.city"),
        cell: (info) => info.getValue() || "—",
      }),
      helper.accessor("country", {
        header: t("fields.country"),
        cell: (info) => {
          const stored = info.getValue();
          if (!stored) return "—";
          const iso = toIsoCountry(stored);
          return iso ? countryName(iso, i18n.language) : stored;
        },
      }),
      helper.accessor("email", {
        header: t("fields.companyEmail"),
        cell: (info) =>
          info.getValue() ? (
            <a
              href={`mailto:${info.getValue()}`}
              onClick={(event) => event.stopPropagation()}
              className="text-primary hover:underline"
            >
              {info.getValue()}
            </a>
          ) : (
            "—"
          ),
      }),
      helper.accessor("phone", {
        header: t("fields.companyPhone"),
        cell: (info) => <MonoCell value={info.getValue() ?? "—"} />,
      }),
      helper.accessor("userCount", {
        header: t("fields.userCount"),
        cell: (info) => (
          <Badge variant="secondary" size="sm">
            {t("recent.accounts", { count: info.getValue() })}
          </Badge>
        ),
      }),
      helper.display({
        id: "actions",
        header: t("actions"),
        cell: (info) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="edit"
              size="icon"
              aria-label={t("edit.title")}
              onClick={(event) => {
                event.stopPropagation();
                setEditing(info.row.original);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="group"
              aria-label={t("delete.confirm")}
              onClick={(event) => {
                event.stopPropagation();
                setDeleting(info.row.original);
              }}
            >
              <Trash2 className="h-4 w-4 text-content-secondary transition-colors group-hover:text-danger-600 dark:group-hover:text-danger-500" />
            </Button>
          </div>
        ),
      }),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, i18n.language]);

  /**
   * Seed the edit form from the stored record: the country string is resolved
   * back to an ISO code, and the E.164 phone is split so the control shows the
   * national part next to the right flag.
   */
  const editDefaults = (company: Company): CompanyContactFormData => {
    const iso = toIsoCountry(company.country) ?? DEFAULT_COUNTRY;
    const { isoCode, national } = fromE164(company.phone, iso);
    return {
      addressLine1: company.addressLine1 ?? "",
      addressLine2: company.addressLine2 ?? "",
      country: isoCode,
      city: company.city ?? "",
      email: company.email ?? "",
      phone: national,
    };
  };

  const handleEdit = async (values: CompanyContactFormData) => {
    if (!editing) return;
    await updateCompany.mutateAsync({ id: editing.id, data: values });
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteCompany.mutateAsync(deleting.id);
    setDeleting(null);
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-lg font-medium text-content">
          {t("restricted.title")}
        </h2>
        <p className="mt-1 text-sm text-content-muted">
          {t("restricted.hint")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11.5px] uppercase tracking-[0.13em] text-accent-600">
          {t("eyebrow")}
        </p>
        <h1 className="mt-1.5 font-display text-[26px] font-semibold text-content sm:text-[30px]">
          {t("companies.title")}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-content-muted">
          {t("companies.subtitle")}
        </p>
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("companies.searchPlaceholder")}
        actions={
          <Button
            variant="gold"
            onClick={() => navigate(langPath("/platform/onboard"))}
          >
            <Plus className="h-4 w-4" />
            {t("onboard.cta")}
          </Button>
        }
      />

      <DataTable<Company>
        data={listQuery.data ?? []}
        columns={columns}
        isLoading={listQuery.isLoading}
        globalFilter={search}
        onRowClick={(company) =>
          navigate(langPath(`/platform/companies/${company.id}`))
        }
      />

      {/* Edit: contact details only — the name is immutable server-side */}
      {editing && (
        <FormDialog<CompanyContactFormData>
          open
          onClose={() => setEditing(null)}
          title={t("edit.title")}
          description={t("edit.description")}
          schema={CompanyContactSchema}
          defaultValues={editDefaults(editing)}
          submitVariant="gold"
          onSubmit={handleEdit}
        >
          {({ control }) => (
            <>
              <div className="rounded-sm border border-border-strong bg-surface px-3 py-2 text-sm text-content-muted dark:border-[color:var(--dark-border)] dark:bg-[color:var(--dark-input)]">
                {t("fields.companyName")}&nbsp;:{" "}
                <span className="font-medium text-content">{editing.name}</span>
              </div>

              <FormField
                name="addressLine1"
                control={control}
                label={t("fields.addressLine1")}
              />
              <FormField
                name="addressLine2"
                control={control}
                label={t("fields.addressLine2")}
              />

              <CountryField
                name="country"
                control={control}
                label={t("fields.country")}
              />

              <CityField
                name="city"
                countryFieldName="country"
                control={control}
                label={t("fields.city")}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  name="email"
                  control={control}
                  label={t("fields.companyEmail")}
                  type="email"
                />
                <PhoneField
                  name="phone"
                  countryFieldName="country"
                  control={control}
                  label={t("fields.companyPhone")}
                />
              </div>
            </>
          )}
        </FormDialog>
      )}

      {/* Delete */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        entityName={deleting?.name}
        onConfirm={handleDelete}
      />
    </div>
  );
};

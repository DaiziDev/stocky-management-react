import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toLocationDefaults } from "@/lib/countries";
import {
  DataTable,
  DataTableToolbar,
  createDataTableColumns,
  MonoCell,
} from "@/components/data-table";
import type { Customer } from "../types";
import type { CustomersFormData } from "../schemas";
import { CustomersSchema } from "../schemas";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "../hooks";
import { FormDialog } from "@/components/forms/FormDialog";
import { ConfirmDialog } from "@/components/forms/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { hasAnyRole } from "@/lib/permissions";
import { CustomerFormFields } from "../components/CustomerFormFields";
import { Pencil, Plus, Trash2 } from "lucide-react";

/**
 * CustomersPage (P4.1) — the pilot pattern on «clients» (person customers).
 * Visible to all roles; manage actions require GESTIONNAIRE+ (same as
 * articles/suppliers). The `CustomerFormFields` body is shared with the
 * details page's edit dialog.
 */
export const CustomersPage = () => {
  const { t } = useTranslation("customers");

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const canManage = hasAnyRole(["ADMIN", "GESTIONNAIRE"]);
  const canCreate = hasAnyRole(["ADMIN", "GESTIONNAIRE", "VENDEUR"]);
  const canDelete = hasAnyRole(["ADMIN"]);

  const listQuery = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const columns = useMemo(() => {
    const helper = createDataTableColumns<Customer>();
    return [
      helper.accessor("lastName", {
        header: t("fields.lastName"),
      }),
      helper.accessor("firstName", {
        header: t("fields.firstName"),
      }),
      helper.accessor("city", {
        header: t("fields.city"),
        cell: (info) => info.getValue() ?? "—",
      }),
      helper.accessor("email", {
        header: t("fields.email"),
        cell: (info) =>
          info.getValue() ? (
            <a
              href={`mailto:${info.getValue()}`}
              className="text-primary hover:underline"
            >
              {info.getValue()}
            </a>
          ) : (
            "—"
          ),
      }),
      helper.accessor("phone", {
        header: t("fields.phone"),
        cell: (info) => <MonoCell value={info.getValue() ?? "—"} />,
      }),
      ...(canManage
        ? [
            helper.display({
              id: "actions",
              header: t("actions"),
              cell: (info) => (
                <div className="flex justify-end gap-1">
                  <Button
                    variant="edit"
                    size="icon"
                    aria-label={t("editTitle")}
                    onClick={() => {
                      setEditing(info.row.original);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="group"
                      aria-label={t("confirmDelete")}
                      onClick={() => setDeleting(info.row.original)}
                    >
                      <Trash2 className="h-4 w-4 text-content-secondary transition-colors group-hover:text-danger-600 dark:group-hover:text-danger-500" />
                    </Button>
                  )}
                </div>
              ),
            }),
          ]
        : []),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, canManage, canDelete]);

  const handleSubmit = async (values: CustomersFormData) => {
    if (editing) {
      await updateCustomer.mutateAsync({ id: editing.id, data: values });
    } else {
      await createCustomer.mutateAsync(values);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteCustomer.mutateAsync(deleting.id);
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content">{t("title")}</h1>
        <p className="mt-1 text-sm text-content-muted">{t("subtitle")}</p>
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("search")}
        actions={
          canCreate && (
            <Button
              variant="gold"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t("createTitle")}
            </Button>
          )
        }
      />

      <DataTable<Customer>
        data={listQuery.data ?? []}
        columns={columns}
        isLoading={listQuery.isLoading}
        globalFilter={search}
      />

      {/* Create / edit — one dialog, shared form body */}
      <FormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        title={editing ? t("editTitle") : t("createTitle")}
        schema={CustomersSchema}
        defaultValues={
          editing
            ? {
                lastName: editing.lastName,
                firstName: editing.firstName,
                addressLine1: editing.addressLine1 ?? "",
                addressLine2: editing.addressLine2 ?? "",
                city: editing.city ?? "",
                postalCode: editing.postalCode ?? "",
                ...toLocationDefaults(editing.country, editing.phone),
                email: editing.email ?? "",
                photo: editing.photo ?? "",
              }
            : { lastName: "", firstName: "" }
        }
        onSubmit={handleSubmit}
      >
        {({ control }) => <CustomerFormFields control={control} />}
      </FormDialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        entityName={
          deleting ? `${deleting.firstName} ${deleting.lastName}` : undefined
        }
        onConfirm={handleDelete}
      />
    </div>
  );
};

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toLocationDefaults } from "@/lib/countries";
import {
  DataTable,
  DataTableToolbar,
  createDataTableColumns,
  MonoCell,
} from "@/components/data-table";
import type { Supplier } from "../types";
import type { SuppliersFormData } from "../schemas";
import { SuppliersSchema } from "../schemas";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "../hooks";
import { FormDialog } from "@/components/forms/FormDialog";
import { ConfirmDialog } from "@/components/forms/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { hasAnyRole } from "@/lib/permissions";
import { SupplierFormFields } from "../components/SupplierFormFields";
import { Pencil, Plus, Trash2 } from "lucide-react";

/**
 * SuppliersPage (P3.4) — the pilot pattern on «fournisseurs».
 * Visible to all roles; manage actions require GESTIONNAIRE+ (same as articles).
 * The `SupplierFormFields` body is shared with the details page's edit dialog.
 */
export const SuppliersPage = () => {
  const { t } = useTranslation("suppliers");

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  const canManage = hasAnyRole(["ADMIN", "GESTIONNAIRE"]);
  const canDelete = hasAnyRole(["ADMIN"]);

  const listQuery = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const columns = useMemo(() => {
    const helper = createDataTableColumns<Supplier>();
    return [
      helper.accessor("name", {
        header: t("fields.name"),
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

  const handleSubmit = async (values: SuppliersFormData) => {
    if (editing) {
      await updateSupplier.mutateAsync({ id: editing.id, data: values });
    } else {
      await createSupplier.mutateAsync(values);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteSupplier.mutateAsync(deleting.id);
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
          canManage && (
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

      <DataTable<Supplier>
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
        schema={SuppliersSchema}
        defaultValues={
          editing
            ? {
                name: editing.name,
                addressLine1: editing.addressLine1 ?? "",
                addressLine2: editing.addressLine2 ?? "",
                city: editing.city ?? "",
                postalCode: editing.postalCode ?? "",
                ...toLocationDefaults(editing.country, editing.phone),
                email: editing.email ?? "",
              }
            : { name: "" }
        }
        onSubmit={handleSubmit}
      >
        {({ control }) => <SupplierFormFields control={control} />}
      </FormDialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        entityName={deleting?.name}
        onConfirm={handleDelete}
      />
    </div>
  );
};

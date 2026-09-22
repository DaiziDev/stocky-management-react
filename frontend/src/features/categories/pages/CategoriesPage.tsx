import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  DataTable,
  DataTableToolbar,
  createDataTableColumns,
  MonoCell,
} from "@/components/data-table";
import type { Category } from "../types";
import type { CategoriesFormData } from "../schemas";
import { CategoriesSchema } from "../schemas";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../hooks";
import { FormDialog } from "@/components/forms/FormDialog";
import { ConfirmDialog } from "@/components/forms/ConfirmDialog";
import { FormField } from "@/components/forms/FormFields";
import { Button } from "@/components/ui/Button";
import { hasAnyRole } from "@/lib/permissions";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";

/**
 * CategoriesPage — the P2 pilot: reference implementation of the full CRUD
 * pattern (list → create/edit dialog → delete confirm → search → pagination →
 * i18n → role gating) that every other feature page copies.
 */
export const CategoriesPage = () => {
  const { t } = useTranslation("categories");
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const canManage = hasAnyRole(["ADMIN", "GESTIONNAIRE"]);
  const canDelete = hasAnyRole(["ADMIN"]);

  const listQuery = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const columns = useMemo(() => {
    const helper = createDataTableColumns<Category>();
    return [
      helper.accessor("code", {
        header: t("fields.code"),
        cell: (info) => <MonoCell value={info.getValue()} />,
      }),
      helper.accessor("designation", {
        header: t("fields.designation"),
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
                    onClick={(event) => {
                      event.stopPropagation();
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
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleting(info.row.original);
                      }}
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

  const handleSubmit = async (values: CategoriesFormData) => {
    if (editing) {
      await updateCategory.mutateAsync({ id: editing.id, data: values });
    } else {
      await createCategory.mutateAsync(values);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteCategory.mutateAsync(deleting.id);
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
          canManage ? (
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
          ) : undefined
        }
      />

      <DataTable<Category>
        data={listQuery.data ?? []}
        columns={columns}
        isLoading={listQuery.isLoading}
        globalFilter={search}
        onRowClick={(category) =>
          navigate(`/catalog/categories/${category.id}`)
        }
        emptyMessage={t("noResults", { defaultValue: "Aucun résultat" })}
        emptyState={
          !listQuery.isLoading && search === "" ? (
            <EmptyCategories
              canManage={canManage}
              onCreate={() => setDialogOpen(true)}
            />
          ) : undefined
        }
      />

      {/* Create / edit */}
      <FormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        title={editing ? t("editTitle") : t("createTitle")}
        schema={CategoriesSchema}
        defaultValues={
          editing
            ? { code: editing.code, designation: editing.designation }
            : { code: "", designation: "" }
        }
        onSubmit={handleSubmit}
      >
        {({ control }) => (
          <>
            <FormField
              name="code"
              control={control}
              label={t("fields.code")}
              required
            />
            <FormField
              name="designation"
              control={control}
              label={t("fields.designation")}
              required
            />
          </>
        )}
      </FormDialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        entityName={
          deleting ? `${deleting.code} — ${deleting.designation}` : undefined
        }
        onConfirm={handleDelete}
      />
    </div>
  );
};

/** Empty-state shown when the list is empty and no search is active. */
function EmptyCategories({
  canManage,
  onCreate,
}: {
  canManage: boolean;
  onCreate: () => void;
}) {
  const { t } = useTranslation("categories");
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Tag
        className="mb-4 h-10 w-10 text-content-disabled"
        aria-hidden="true"
      />
      <h3 className="mb-1 text-lg font-medium text-content">{t("title")}</h3>
      <p className="mb-4 max-w-sm text-sm text-content-muted">
        {t("subtitle")}
      </p>
      {canManage && (
        <Button variant="gold" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          {t("createTitle")}
        </Button>
      )}
    </div>
  );
}

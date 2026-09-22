import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DataTable,
  DataTableToolbar,
  createDataTableColumns,
  MonoCell,
  CurrencyCell,
  BadgeCell,
} from "@/components/data-table";
import type { Article, CategorieSummary } from "../types";
import type { ArticlesFormData } from "../schemas";
import { ArticlesSchema, DEFAULT_VAT_RATE } from "../schemas";
import {
  useArticles,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
} from "../hooks";
import { useCategories } from "@/features/categories/hooks";
import { FormDialog } from "@/components/forms/FormDialog";
import { ConfirmDialog } from "@/components/forms/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { ArticleFormFields } from "../components/ArticleFormFields";
import { hasAnyRole } from "@/lib/permissions";
import { formatStockStatus } from "@/lib/formatters";
import { Pencil, Plus, Trash2 } from "lucide-react";

/**
 * ArticlesPage (P3.1) — the Categories pilot pattern applied to the catalog's
 * main entity: DataTable with stock-status badges, category filter, and a
 * form dialog with a category select fed by the categories feature.
 */
export const ArticlesPage = () => {
  const { t } = useTranslation("articles");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState<
    "all" | "inStock" | "low" | "out"
  >("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState<Article | null>(null);

  const canManage = hasAnyRole(["ADMIN", "GESTIONNAIRE"]);
  const canDelete = hasAnyRole(["ADMIN"]);

  const listQuery = useArticles();
  const categoriesQuery = useCategories();
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const deleteArticle = useDeleteArticle();

  /** Options for both the filter select and the form's category select. */
  const categoryOptions = useMemo(
    () =>
      (categoriesQuery.data ?? []).map((c: CategorieSummary) => ({
        value: c.id,
        label: c.designation,
      })),
    [categoriesQuery.data],
  );

  const filteredData = useMemo(() => {
    const data = listQuery.data ?? [];
    return data.filter((article: Article) => {
      const matchesCategory =
        !categoryFilter || article.category?.id === categoryFilter;
      if (!matchesCategory) return false;

      if (stockStatusFilter === "all") return true;
      const status = formatStockStatus(article.currentStock, article.minStock);
      return (
        status.variant ===
        (stockStatusFilter === "out"
          ? "danger"
          : stockStatusFilter === "low"
            ? "warning"
            : "success")
      );
    });
  }, [listQuery.data, categoryFilter, stockStatusFilter]);

  const columns = useMemo(() => {
    const helper = createDataTableColumns<Article>();
    return [
      helper.accessor("code", {
        header: t("fields.code"),
        cell: (info) => <MonoCell value={info.getValue()} />,
      }),
      helper.accessor("designation", {
        header: t("fields.designation"),
      }),
      helper.accessor((row) => row.category?.designation ?? "—", {
        id: "category",
        header: t("fields.category"),
      }),
      helper.accessor("unitPriceHt", {
        header: t("fields.unitPriceHt"),
        cell: (info) => <CurrencyCell value={info.getValue()} />,
      }),
      helper.accessor("currentStock", {
        header: t("fields.currentStock"),
        cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
      }),
      helper.accessor(
        (row) =>
          row.currentStock <= 0 ? 0 : row.currentStock <= row.minStock ? 1 : 2,
        {
          id: "stockStatus",
          header: t("status", { ns: "common", defaultValue: "Statut" }),
          cell: (info) => {
            const row = info.row.original;
            const status = formatStockStatus(row.currentStock, row.minStock);
            const label =
              status.variant === "danger"
                ? t("stock.out")
                : status.variant === "warning"
                  ? t("stock.low")
                  : t("stock.inStock");
            return <BadgeCell label={label} variant={status.variant} />;
          },
        },
      ),
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

  const handleSubmit = async (values: ArticlesFormData) => {
    if (editing) {
      await updateArticle.mutateAsync({ id: editing.id, data: values });
    } else {
      await createArticle.mutateAsync(values);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteArticle.mutateAsync(deleting.id);
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
      >
        {/* Category filter select */}
        <div className="flex flex-wrap gap-2">
          <div className="w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-sm border border-border-strong bg-surface px-3 py-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[color:var(--dark-border)] dark:bg-[color:var(--dark-input)]"
              aria-label={t("fields.category")}
            >
              <option value="">{t("allCategories")}</option>
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-48">
            <select
              value={stockStatusFilter}
              onChange={(e) =>
                setStockStatusFilter(
                  e.target.value as "all" | "inStock" | "low" | "out",
                )
              }
              className="w-full rounded-sm border border-border-strong bg-surface px-3 py-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[color:var(--dark-border)] dark:bg-[color:var(--dark-input)]"
              aria-label={t("statusFilter")}
            >
              <option value="all">{t("allStatuses")}</option>
              <option value="inStock">{t("stock.inStock")}</option>
              <option value="low">{t("stock.low")}</option>
              <option value="out">{t("stock.out")}</option>
            </select>
          </div>
        </div>
      </DataTableToolbar>

      <DataTable<Article>
        data={filteredData}
        columns={columns}
        isLoading={listQuery.isLoading}
        globalFilter={search}
      />

      {/* Create / edit */}
      <FormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        title={editing ? t("editTitle") : t("createTitle")}
        schema={ArticlesSchema}
        defaultValues={
          editing
            ? {
                code: editing.code,
                designation: editing.designation,
                unitPriceHt: editing.unitPriceHt,
                vatRate: editing.vatRate,
                photo: editing.photo,
                minStock: editing.minStock,
                categoryId: editing.category?.id ?? "",
              }
            : {
                code: "",
                designation: "",
                // Left empty so the first keystroke is the first digit — a
                // default of 0 made "1" render as "01" (see NumericInput).
                unitPriceHt: undefined,
                vatRate: DEFAULT_VAT_RATE,
                categoryId: "",
              }
        }
        onSubmit={handleSubmit}
      >
        {({ control }) => (
          <ArticleFormFields
            control={control}
            categoryOptions={categoryOptions}
          />
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

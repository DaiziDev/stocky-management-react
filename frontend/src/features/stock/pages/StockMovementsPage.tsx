import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  DataTable,
  DataTableToolbar,
  createDataTableColumns,
  DateCell,
} from "@/components/data-table";
import type { StockMovement, StockMovementType } from "../types";
import { useStockMovements, useCreateStockAdjustment } from "../hooks";
import { useArticles } from "@/features/articles/hooks";
import { FormDialog } from "@/components/forms/FormDialog";
import {
  FormField,
  NumberField,
  SelectField,
} from "@/components/forms/FormFields";
import {
  StockAdjustmentSchema,
  type StockAdjustmentFormData,
} from "../schemas";
import { Button } from "@/components/ui/Button";
import { hasAnyRole } from "@/lib/permissions";
import { Plus, TrendingDown, TrendingUp, Scale } from "lucide-react";

const TYPE_ICON_CLASS = {
  ENTREE: "text-success-600 dark:text-success-500",
  SORTIE: "text-danger-600 dark:text-danger-500",
  AJUSTEMENT: "text-info-600 dark:text-info-500",
} as const;

/**
 * StockMovementsPage (P5.2) — the movements ledger:
 * date, article (links to details), typed movement (Entrée/Sortie/Ajustement),
 * signed quantity, motif + origin, and resulting stock. The type filter is
 * server-side (`?type=`). GESTIONNAIRE+ can post a manual inventory
 * correction (signed quantity + mandatory motif) via POST /mouvements-stock.
 */
export const StockMovementsPage = () => {
  const { t } = useTranslation("stock");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<StockMovementType | "">("");
  const [adjustOpen, setAdjustOpen] = useState(false);

  const canManage = hasAnyRole(["ADMIN", "GESTIONNAIRE"]);

  const movementsQuery = useStockMovements(
    typeFilter ? { type: typeFilter } : undefined,
  );
  const createAdjustment = useCreateStockAdjustment();

  const typeOptions = useMemo(
    () =>
      (["ENTREE", "SORTIE", "AJUSTEMENT"] as const).map((type) => ({
        value: type,
        label: t(`movementType.${type}`),
      })),
    [t],
  );

  const columns = useMemo(() => {
    const helper = createDataTableColumns<StockMovement>();
    return [
      helper.accessor("date", {
        header: t("fields.date"),
        cell: (info) => <DateCell value={info.getValue()} withTime />,
      }),
      helper.accessor("articleDesignation", {
        header: t("fields.article"),
        cell: (info) => (
          <Link
            to={`/catalog/articles/${info.row.original.articleId}`}
            className="text-content hover:text-primary hover:underline"
          >
            {info.getValue()}
          </Link>
        ),
      }),
      helper.accessor("type", {
        header: t("fields.type"),
        cell: (info) => (
          <span
            className={`inline-flex items-center gap-1 text-sm font-medium ${TYPE_ICON_CLASS[info.getValue()]}`}
          >
            {info.getValue() === "ENTREE" && (
              <TrendingDown
                className="h-3.5 w-3.5 rotate-180"
                aria-hidden="true"
              />
            )}
            {info.getValue() === "SORTIE" && (
              <TrendingUp
                className="h-3.5 w-3.5 rotate-180"
                aria-hidden="true"
              />
            )}
            {info.getValue() === "AJUSTEMENT" && (
              <Scale className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {t(`movementType.${info.getValue()}`)}
          </span>
        ),
      }),
      helper.accessor("quantity", {
        header: t("fields.quantity"),
        cell: (info) => {
          const m = info.row.original;
          const signed =
            m.type === "AJUSTEMENT" && m.quantity > 0
              ? `+${m.quantity}`
              : String(m.quantity);
          return (
            <span
              className={`tabular-nums font-medium ${m.quantity < 0 ? "text-danger-600 dark:text-danger-500" : "text-success-600 dark:text-success-500"}`}
            >
              {signed}
            </span>
          );
        },
      }),
      helper.accessor("reason", {
        header: t("fields.reason"),
        cell: (info) => (
          <span className="block max-w-48 truncate" title={info.getValue()}>
            {info.getValue()}
          </span>
        ),
      }),
      helper.accessor("origin", {
        header: t("fields.origin"),
        cell: (info) => info.getValue() ?? "—",
      }),
      helper.accessor("stockAfter", {
        header: t("fields.stockAfter"),
        cell: (info) => (
          <span className="tabular-nums text-content-secondary">
            {info.getValue()}
          </span>
        ),
      }),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const handleAdjust = async (values: StockAdjustmentFormData) => {
    await createAdjustment.mutateAsync(values);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content">
          {t("movementsTitle")}
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          {t("movementsSubtitle")}
        </p>
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("search")}
        actions={
          <>
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as StockMovementType | "")
              }
              className="h-9 rounded-sm border border-border-strong bg-surface px-2 text-sm text-content dark:border-[color:var(--dark-border)] dark:bg-[color:var(--dark-input)]"
              aria-label={t("filterType")}
            >
              <option value="">{t("filterAll")}</option>
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {canManage && (
              <Button variant="gold" onClick={() => setAdjustOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("adjust")}
              </Button>
            )}
          </>
        }
      />

      <DataTable<StockMovement>
        data={movementsQuery.data ?? []}
        columns={columns}
        isLoading={movementsQuery.isLoading}
        globalFilter={search}
      />

      {/* Manual inventory correction */}
      <AdjustDialog
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        onSubmit={handleAdjust}
      />
    </div>
  );
};

/**
 * Adjustment dialog — article picker, signed quantity, mandatory motif.
 *
 * Built on the standard FormDialog + zod resolver, so the three fields the
 * contract requires are validated and their messages rendered like every
 * other form in the app.
 */
function AdjustDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: StockAdjustmentFormData) => Promise<unknown>;
}) {
  const { t } = useTranslation("stock");
  const articlesQuery = useArticles();

  const articleOptions = (articlesQuery.data ?? []).map((article) => ({
    value: article.id,
    label: `${article.code} — ${article.designation}`,
  }));

  return (
    <FormDialog<StockAdjustmentFormData>
      open={open}
      onClose={onClose}
      title={t("adjustTitle")}
      schema={StockAdjustmentSchema}
      defaultValues={{ articleId: "", quantity: 1, reason: "" }}
      onSubmit={onSubmit}
    >
      {({ control }) => (
        <>
          <SelectField
            name="articleId"
            control={control}
            label={t("fields.article")}
            placeholder="—"
            options={articleOptions}
            required
          />
          <NumberField
            name="quantity"
            control={control}
            label={t("fields.quantitySigned")}
            helperText={t("fields.quantitySignedHint")}
            step={1}
            required
          />
          <FormField
            name="reason"
            control={control}
            label={t("fields.reason")}
            required
          />
        </>
      )}
    </FormDialog>
  );
}

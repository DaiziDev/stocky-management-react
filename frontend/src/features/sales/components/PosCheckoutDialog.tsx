import { useMemo } from "react";
import {
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormDialog } from "@/components/forms/FormDialog";
import { NumberField, SelectField } from "@/components/forms/FormFields";
import { Button } from "@/components/ui/Button";
import { useArticles } from "@/features/articles/hooks";
import { useCustomers } from "@/features/customers/hooks";
import { formatCurrency } from "@/lib/utils";
import type { Article } from "@/features/articles/types";
import { SaleSchema, type SaleFormData } from "../schemas";
import { useCheckoutSale } from "../hooks";
import { Plus, Trash2 } from "lucide-react";

interface PosCheckoutDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The POS cart (P5.4) — «Encaisser une vente»:
 *  - cart lines via RHF `useFieldArray` (article select + quantity, add/remove)
 *  - unit prices shown live from the articles list (the server prices the sale)
 *  - optional customer — walk-in sales are allowed by `VenteRequestDTO`
 *  - running HT total client-side; the authoritative total comes back from the server
 * On success the mutation invalidates stock/articles/sales and toasts.
 */
export function PosCheckoutDialog({ open, onClose }: PosCheckoutDialogProps) {
  const { t } = useTranslation("sales");
  const checkout = useCheckoutSale();

  return (
    <FormDialog<SaleFormData>
      open={open}
      onClose={onClose}
      title={t("posTitle")}
      description={t("checkoutHint")}
      schema={SaleSchema}
      defaultValues={{
        customerId: "",
        lines: [{ articleId: "", quantity: 1 }],
      }}
      submitLabel={t("checkout")}
      onSubmit={(values) =>
        checkout.mutateAsync({
          customerId: values.customerId || undefined,
          lines: values.lines.map((l) => ({
            articleId: l.articleId,
            quantity: l.quantity,
          })),
        })
      }
    >
      {({ control, formState }) => (
        <CartLines control={control} errors={formState.errors} />
      )}
    </FormDialog>
  );
}

/** The cart body — proper component so useFieldArray/useWatch are legal hooks. */
function CartLines({
  control,
  errors,
}: {
  control: Control<SaleFormData>;
  errors: FieldErrors<SaleFormData>;
}) {
  const { t } = useTranslation("sales");
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const watchedLines = useWatch({ control, name: "lines" }) ?? [];

  const articlesQuery = useArticles();
  const customersQuery = useCustomers();

  /** articleId → Article, for live unit prices. */
  const articleById = useMemo(() => {
    const map = new Map<string, Article>();
    for (const a of articlesQuery.data ?? []) map.set(a.id, a);
    return map;
  }, [articlesQuery.data]);

  const articleOptions = useMemo(
    () =>
      (articlesQuery.data ?? []).map((a) => ({
        value: a.id,
        label: `${a.code} — ${a.designation} (${formatCurrency(a.unitPriceHt)})`,
      })),
    [articlesQuery.data],
  );

  /** Optional customer: '' = anonymous walk-in sale (clientId omitted on the wire). */
  const customerOptions = useMemo(
    () => [
      { value: "", label: t("anonymous") },
      ...(customersQuery.data ?? []).map((c) => ({
        value: c.id,
        label: `${c.firstName} ${c.lastName}`,
      })),
    ],
    [customersQuery.data, t],
  );

  const runningTotal = watchedLines.reduce((sum, line) => {
    const article = line?.articleId
      ? articleById.get(line.articleId)
      : undefined;
    return sum + (article ? article.unitPriceHt * (line.quantity || 0) : 0);
  }, 0);

  return (
    <div className="space-y-4">
      <SelectField
        name="customerId"
        control={control}
        label={t("fields.customer")}
        options={customerOptions}
      />

      <div className="space-y-3">
        <p className="text-sm font-medium text-content">{t("cart")}</p>
        {fields.map((field, index) => {
          const line = watchedLines[index];
          const article = line?.articleId
            ? articleById.get(line.articleId)
            : undefined;
          const lineTotal = article
            ? article.unitPriceHt * (line.quantity || 0)
            : 0;
          const lineError = errors.lines?.[index];
          return (
            <div
              key={field.id}
              className="grid grid-cols-[1fr_88px_auto] items-start gap-2"
            >
              <div className="space-y-1">
                <SelectField
                  name={`lines.${index}.articleId` as const}
                  control={control}
                  options={articleOptions}
                  placeholder="—"
                  aria-label={t("fields.article")}
                />
                {line?.articleId && article && (
                  <p className="px-1 text-xs text-content-muted">
                    {t("fields.stock")}&nbsp;:{" "}
                    <span className="tabular-nums">
                      {article.currentStock ?? 0}
                    </span>
                    {(article.currentStock ?? 0) <= 0 && (
                      <span className="ml-2 font-medium text-danger-600 dark:text-danger-500">
                        {t("outOfStock")}
                      </span>
                    )}
                  </p>
                )}
              </div>
              <NumberField
                name={`lines.${index}.quantity` as const}
                control={control}
                min={1}
                step={1}
                aria-label={t("fields.quantity")}
              />
              <div className="flex h-9 items-center gap-1">
                <span className="min-w-20 text-right text-sm tabular-nums text-content">
                  {lineTotal > 0 ? formatCurrency(lineTotal) : "—"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="group"
                  disabled={fields.length === 1}
                  aria-label={t("actions")}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4 text-content-secondary transition-colors group-hover:text-danger-600 dark:group-hover:text-danger-500" />
                </Button>
              </div>
              {(lineError?.articleId?.message ||
                lineError?.quantity?.message) && (
                <p className="col-span-full text-xs text-danger-600 dark:text-danger-500">
                  {lineError?.articleId?.message ??
                    lineError?.quantity?.message}
                </p>
              )}
            </div>
          );
        })}
        {errors.lines?.message && typeof errors.lines.message === "string" && (
          <p className="text-xs text-danger-600 dark:text-danger-500">
            {errors.lines.message}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ articleId: "", quantity: 1 })}
        >
          <Plus className="h-4 w-4" />
          {t("addLine")}
        </Button>
      </div>

      <div className="flex items-center justify-between border-t border-border-strong pt-3 dark:border-[color:var(--dark-border)]">
        <span className="text-sm text-content-secondary">
          {t("fields.total")} (HT)
        </span>
        <span className="text-lg font-bold tabular-nums text-content">
          {formatCurrency(runningTotal)}
        </span>
      </div>
    </div>
  );
}

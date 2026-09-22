import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFieldArray, useWatch, type Control } from "react-hook-form";
import { FormDialog } from "@/components/forms/FormDialog";
import { NumberField } from "@/components/forms/FormFields";
import {
  PartialReceptionSchema,
  type PartialReceptionFormData,
} from "../schemas";
import { useReceivePartialSupplierOrder } from "../hooks";
import type { SupplierOrder } from "../types";

/**
 * «Réception partielle» — records what a delivery actually contained.
 *
 * A full reception credits stock with the whole ordered quantity, which is
 * wrong when the supplier ships short. This dialog captures the quantity
 * received per line and posts it to PUT /{id}/receptionner-partiel; the order
 * stays RECUE_PARTIELLEMENT until every line is complete.
 *
 * Each line is pre-filled with what is still outstanding (ordered − already
 * received), which is the common case, and capped at that value so a
 * reception can never credit more stock than was ordered.
 */
interface PartialReceptionDialogProps {
  order: SupplierOrder;
  open: boolean;
  onClose: () => void;
}

/** Outstanding quantity for a line — never negative. */
const outstanding = (line: SupplierOrder["lines"][number]): number =>
  Math.max(0, line.quantity - line.receivedQuantity);

function ReceptionLines({
  order,
  control,
}: {
  order: SupplierOrder;
  control: Control<PartialReceptionFormData>;
}) {
  const { t } = useTranslation("supplier-orders");
  const { fields } = useFieldArray({ control, name: "lines" });
  const values = useWatch({ control, name: "lines" });

  const total = useMemo(
    () =>
      (values ?? []).reduce(
        (sum, line) => sum + (line?.receivedQuantity || 0),
        0,
      ),
    [values],
  );

  return (
    <div className="space-y-3">
      {fields.map((field, index) => {
        const line = order.lines[index];
        const max = outstanding(line);

        return (
          <div
            key={field.id}
            className="grid grid-cols-[1fr_auto] items-end gap-3 rounded-[11px] border border-border p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-content">
                {line.articleDesignation}
              </p>
              <p className="mt-0.5 font-mono text-xs text-content-muted">
                {t("reception.lineSummary", {
                  ordered: line.quantity,
                  received: line.receivedQuantity,
                  outstanding: max,
                })}
              </p>
            </div>
            <div className="w-28">
              <NumberField
                name={`lines.${index}.receivedQuantity`}
                control={control}
                label={t("reception.quantityLabel")}
                min={0}
                max={max}
              />
            </div>
          </div>
        );
      })}

      <p className="text-right text-sm text-content-secondary">
        {t("reception.total", { count: total })}
      </p>
    </div>
  );
}

export function PartialReceptionDialog({
  order,
  open,
  onClose,
}: PartialReceptionDialogProps) {
  const { t } = useTranslation("supplier-orders");
  const receivePartial = useReceivePartialSupplierOrder();

  return (
    <FormDialog<PartialReceptionFormData>
      open={open}
      onClose={onClose}
      title={t("reception.title")}
      description={t("reception.description")}
      schema={PartialReceptionSchema}
      className="max-w-xl"
      submitLabel={t("reception.submit")}
      defaultValues={{
        lines: order.lines.map((line) => ({
          lineId: line.id,
          receivedQuantity: outstanding(line),
        })),
      }}
      onSubmit={(values) =>
        receivePartial.mutateAsync({ id: order.id, data: values })
      }
    >
      {({ control }) => <ReceptionLines order={order} control={control} />}
    </FormDialog>
  );
}

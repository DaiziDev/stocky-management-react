import { useMemo } from "react";
import { useFieldArray, type Control, type FieldPath } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormDialog } from "@/components/forms/FormDialog";
import { NumberField, SelectField } from "@/components/forms/FormFields";
import { useArticles } from "@/features/articles/hooks";
import { useCustomers } from "@/features/customers/hooks";
import { useCreateCustomerOrder } from "../hooks";
import { CustomerOrderSchema, type CustomerOrderFormData } from "../schemas";

const initialValues: CustomerOrderFormData = {
  customerId: "",
  lines: [{ articleId: "", quantity: 1 }],
};

export function CustomerOrderFormDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation("customer-orders");
  const customersQuery = useCustomers();
  const articlesQuery = useArticles();
  const createOrder = useCreateCustomerOrder();

  const customerOptions = useMemo(
    () =>
      (customersQuery.data ?? []).map((customer) => ({
        value: customer.id,
        label: `${customer.firstName} ${customer.lastName}`,
      })),
    [customersQuery.data],
  );
  const articleOptions = useMemo(
    () =>
      (articlesQuery.data ?? []).map((article) => ({
        value: article.id,
        label: `${article.code} — ${article.designation}`,
      })),
    [articlesQuery.data],
  );

  return (
    <FormDialog<CustomerOrderFormData>
      open={open}
      onClose={onClose}
      title={t("createTitle")}
      description={t("createDescription")}
      schema={CustomerOrderSchema}
      defaultValues={initialValues}
      submitLabel={t("createSubmit")}
      submitVariant="gold"
      className="max-w-3xl"
      onSubmit={(values) => createOrder.mutateAsync(values)}
    >
      {({ control }) => (
        <CustomerOrderFormBody
          control={control}
          customerOptions={customerOptions}
          articleOptions={articleOptions}
        />
      )}
    </FormDialog>
  );
}

function CustomerOrderFormBody({
  control,
  customerOptions,
  articleOptions,
}: {
  control: Control<CustomerOrderFormData>;
  customerOptions: Array<{ value: string; label: string }>;
  articleOptions: Array<{ value: string; label: string }>;
}) {
  const { t } = useTranslation("customer-orders");
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });

  return (
    <div className="space-y-5">
      <SelectField
        name="customerId"
        control={control}
        label={t("fields.customer")}
        required
        options={customerOptions}
        placeholder={t("selectCustomer")}
      />

      <section className="space-y-3 rounded-md border border-border bg-surface-secondary/40 p-3 dark:border-[color:var(--dark-border)] dark:bg-[color:var(--dark-surface-secondary)]/40 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-content">
              {t("linesCard")}
            </h3>
            <p className="mt-1 text-xs text-content-muted">
              {t("createLinesHint")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ articleId: "", quantity: 1 })}
          >
            <Plus className="h-4 w-4" />
            {t("addLine")}
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 gap-3 rounded-sm border border-border bg-surface p-3 dark:border-[color:var(--dark-border)] sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end"
            >
              <SelectField
                name={
                  `lines.${index}.articleId` as FieldPath<CustomerOrderFormData>
                }
                control={control}
                label={t("fields.article")}
                required
                options={articleOptions}
                placeholder={t("selectArticle")}
              />
              <NumberField
                name={
                  `lines.${index}.quantity` as FieldPath<CustomerOrderFormData>
                }
                control={control}
                label={t("fields.quantity")}
                min={1}
                step={1}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="group sm:mb-0.5"
                disabled={fields.length === 1}
                aria-label={t("removeLine")}
                title={t("removeLine")}
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4 text-content-secondary transition-colors group-hover:text-danger-600 dark:group-hover:text-danger-500" />
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

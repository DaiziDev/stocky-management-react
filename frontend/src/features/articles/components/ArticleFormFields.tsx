import { useTranslation } from "react-i18next";
import type { Control, FieldValues, Path } from "react-hook-form";
import {
  FormField,
  SelectField,
  CurrencyInputField,
  NumberField,
  PercentField,
} from "@/components/forms/FormFields";
import type { ArticlesFormData } from "../schemas";

interface ArticleFormFieldsProps<T extends FieldValues> {
  control: Control<T>;
  categoryOptions: Array<{ value: string; label: string }>;
  /** i18n label key prefix (default "fields"). */
  labelPrefix?: string;
}

/**
 * The article form body (P3.1) — shared by the Articles list dialog and the
 * details-page edit dialog so both stay in sync with the schema.
 * T is the form values type (ArticlesFormData-compatible).
 */
export function ArticleFormFields<T extends FieldValues>({
  control,
  categoryOptions,
  labelPrefix = "fields",
}: ArticleFormFieldsProps<T>) {
  const { t } = useTranslation("articles");
  // Dynamic key → t() returns a union; labels are always strings in our JSONs.
  const label = (key: string): string => t(`${labelPrefix}.${key}`) as string;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          name={"code" as Path<T>}
          control={control}
          label={label("code")}
          required
        />
        <SelectField
          name={"categoryId" as Path<T>}
          control={control}
          label={label("category")}
          required
          options={categoryOptions}
          placeholder={t("allCategories")}
        />
      </div>
      <FormField
        name={"designation" as Path<T>}
        control={control}
        label={label("designation")}
        required
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CurrencyInputField
          name={"unitPriceHt" as Path<T>}
          control={control}
          label={label("unitPriceHt")}
          required
        />
        {/* Typed and shown in percent; the form still stores the fraction. */}
        <PercentField
          name={"vatRate" as Path<T>}
          control={control}
          label={label("vatRate")}
          required
          helperText={t("vatHint")}
        />
      </div>
      {/*
        No photo input: swagger types `photo` as a plain string and exposes NO
        upload endpoint, so the field could only ever hold a URL typed by
        hand. The value of an existing article is carried through the form
        untouched (see the pages' defaultValues), so editing never wipes it.
      */}
      <NumberField
        name={"minStock" as Path<T>}
        control={control}
        label={label("minStock")}
        min={0}
        step={1}
      />
    </>
  );
}

// Convenience type re-export for consumers wiring FormDialog generics.
export type { ArticlesFormData };

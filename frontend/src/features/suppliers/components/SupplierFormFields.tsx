import { useTranslation } from "react-i18next";
import type { Control, FieldValues, Path } from "react-hook-form";
import { FormField } from "@/components/forms/FormFields";
import { PhoneField } from "@/components/forms/LocationFields";

interface SupplierFormFieldsProps<T extends FieldValues> {
  control: Control<T>;
  /** i18n label key prefix (default "fields"). */
  labelPrefix?: string;
}

/**
 * The supplier form body (P3.4) — shared by the Suppliers list dialog and the
 * details-page edit dialog so both stay in sync with the schema.
 * Mirrors `FournisseurRequestDTO`: name required, address/contact optional.
 */
export function SupplierFormFields<T extends FieldValues>({
  control,
  labelPrefix = "fields",
}: SupplierFormFieldsProps<T>) {
  const { t } = useTranslation("suppliers");
  // Dynamic key → t() returns a union; labels are always strings in our JSONs.
  const label = (key: string): string => t(`${labelPrefix}.${key}`) as string;

  return (
    <div className="flex flex-col gap-4">
      <FormField
        name={"name" as Path<T>}
        control={control}
        label={label("name")}
        required
      />
      <FormField
        name={"city" as Path<T>}
        control={control}
        label={label("city")}
      />
      <FormField
        name={"email" as Path<T>}
        control={control}
        label={label("email")}
        type="email"
      />
      <PhoneField
        name={"phone" as Path<T>}
        countryFieldName={"country" as Path<T>}
        control={control}
        label={label("phone")}
      />
    </div>
  );
}

import { useTranslation } from "react-i18next";
import type { Control, FieldValues, Path } from "react-hook-form";
import { FormField } from "@/components/forms/FormFields";
import { PhoneField } from "@/components/forms/LocationFields";

interface CustomerFormFieldsProps<T extends FieldValues> {
  control: Control<T>;
  /** i18n label key prefix (default "fields"). */
  labelPrefix?: string;
}

/**
 * The customer form body (P4.1) — shared by the Customers list dialog and the
 * details-page edit dialog so both stay in sync with the schema.
 * Mirrors `ClientRequestDTO`: nom + prenom required, address/contact optional.
 */
export function CustomerFormFields<T extends FieldValues>({
  control,
  labelPrefix = "fields",
}: CustomerFormFieldsProps<T>) {
  const { t } = useTranslation("customers");
  // Dynamic key → t() returns a union; labels are always strings in our JSONs.
  const label = (key: string): string => t(`${labelPrefix}.${key}`) as string;

  return (
    <div className="flex flex-col gap-4">
      <FormField
        name={"firstName" as Path<T>}
        control={control}
        label={label("firstName")}
        required
      />
      <FormField
        name={"lastName" as Path<T>}
        control={control}
        label={label("lastName")}
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

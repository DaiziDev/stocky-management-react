import { useEffect } from "react";
import {
  useForm,
  FormProvider,
  type UseFormReturn,
  type Resolver,
  type DefaultValues,
  type FieldValues,
  type SubmitHandler,
  type Path,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Dialog } from "@/components/ui/Dialog";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";
import { extractFieldErrors } from "@/api/interceptors";
import { getFieldErrors } from "@/lib/error-handler";

/**
 * FormDialog (P1.2) — the standard create/edit pattern:
 * Dialog + RHF + zodResolver + pending submit button. Backend field errors
 * are mapped onto RHF errors automatically; any thrown error re-throws with
 * `{ handled: true }` so the global MutationCache skips its toast.
 *
 * Usage:
 *   <FormDialog
 *     open={open} onClose={() => setOpen(false)}
 *     title={t('createTitle')} schema={CategoriesSchema}
 *     defaultValues={{ code: '', designation: '' }}
 *     onSubmit={(values) => createCategory.mutateAsync(values)}
 *   >
 *     {(form) => (<>
 *       <FormField name="code" control={form.control} label="Code" />
 *       ...
 *     </>)}
 *   </FormDialog>
 */
interface FormDialogProps<TValues extends FieldValues> {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** zod schema whose output matches TValues (z.infer<typeof Schema>). */
  schema: z.ZodType<TValues, FieldValues>;
  /**
   * RHF's own default-values type rather than `TValues`: a CREATE form
   * legitimately starts with its required fields empty (a price input must
   * begin blank, not at 0), which `TValues` would reject.
   */
  defaultValues: DefaultValues<TValues>;
  onSubmit: (values: TValues) => Promise<unknown>;
  /** Submit label (default: i18n common.save). */
  submitLabel?: string;
  /** Submit button color variant (default: form/sidebar color). */
  submitVariant?: ButtonProps["variant"];
  /** Forwarded to the Dialog panel — e.g. "max-w-2xl" for a wide form. */
  className?: string;
  /** Optional custom footer for multi-step forms. */
  renderFooter?: (form: UseFormReturn<TValues>) => React.ReactNode;
  children: (form: UseFormReturn<TValues>) => React.ReactNode;
}

export function FormDialog<TValues extends FieldValues>({
  open,
  onClose,
  title,
  description,
  schema,
  defaultValues,
  onSubmit,
  submitLabel,
  submitVariant = "gold",
  className,
  renderFooter,
  children,
}: FormDialogProps<TValues>) {
  const { t } = useTranslation("common");

  // RHF's three-generic useForm signature needs explicit args; the resolver
  // cast bridges zod's structural output type to RHF's FieldValues contract.
  const form = useForm<TValues, unknown, TValues>({
    resolver: zodResolver(schema) as unknown as Resolver<TValues>,
    defaultValues,
    mode: "onTouched",
  });

  // Reset the form each time the dialog opens (fresh create/edit).
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit: SubmitHandler<TValues> = async (values) => {
    try {
      await onSubmit(values);
      onClose();
    } catch (error) {
      // Map backend field errors (400) onto the form, then re-throw flagged
      // as handled so the global mutation cache doesn't double-toast.
      const fieldErrors = {
        ...extractFieldErrors(error),
        ...getFieldErrors(error),
      };
      (Object.keys(fieldErrors) as Array<Path<TValues>>).forEach((field) => {
        form.setError(field, { type: "server", message: fieldErrors[field] });
      });
      throw Object.assign(
        error instanceof Object ? error : new Error(String(error)),
        { handled: true },
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? undefined : onClose())}
      title={title}
      description={description}
      className={className}
    >
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
          <fieldset
            disabled={form.formState.isSubmitting}
            className="space-y-4"
          >
            {children(form)}
          </fieldset>
          {renderFooter ? (
            renderFooter(form)
          ) : (
            <div className="mt-6 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant={submitVariant}
                loading={form.formState.isSubmitting}
              >
                {submitLabel ?? t("save")}
              </Button>
            </div>
          )}
        </form>
      </FormProvider>
    </Dialog>
  );
}

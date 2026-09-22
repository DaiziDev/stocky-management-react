import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { UseFormReturn } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ShieldCheck,
} from "lucide-react";
import { FormDialog } from "@/components/forms/FormDialog";
import { FormField } from "@/components/forms/FormFields";
import { CountryField, PhoneField } from "@/components/forms/LocationFields";
import {
  CompanyOnboardingSchema,
  EMPTY_ONBOARDING,
  type CompanyOnboardingFormData,
} from "../schemas";
import { useOnboardCompany } from "../hooks";

interface OnboardCompanyDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = 1 | 2;

const COMPANY_FIELDS = [
  "companyName",
  "addressLine1",
  "addressLine2",
  "country",
  "city",
  "companyEmail",
  "companyPhone",
] as const;

function StepIndicator({ step }: { step: Step }) {
  const { t } = useTranslation("platform");

  return (
    <div className="mb-5 flex items-center gap-2 rounded-xl border border-border bg-surface-secondary p-2">
      {[
        { number: 1, icon: Building2, label: t("onboard.companyStep") },
        { number: 2, icon: ShieldCheck, label: t("onboard.adminStep") },
      ].map(({ number, label }) => {
        const active = step === number;
        const complete = step > number;

        return (
          <div
            key={number}
            className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
              active
                ? "bg-surface text-content shadow-xs"
                : complete
                  ? "text-accent-700 dark:text-accent-400"
                  : "text-content-muted"
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                active || complete
                  ? "bg-accent-500 text-primary-950"
                  : "bg-surface text-content-muted"
              }`}
            >
              {complete ? <Check className="h-4 w-4" /> : number}
            </span>
            <span className="truncate text-xs font-semibold sm:text-sm">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Two-step onboarding flow matching AdminEntrepriseRequestDTO:
 * step one collects the company, step two collects the required admin account.
 * Only fields required by Swagger are mandatory; optional values are omitted
 * from the wire payload when left empty.
 */
export function OnboardCompanyDialog({
  open,
  onClose,
}: OnboardCompanyDialogProps) {
  const { t } = useTranslation("platform");
  const onboard = useOnboardCompany();
  const [step, setStep] = useState<Step>(1);

  const validateStep = async (
    form: UseFormReturn<CompanyOnboardingFormData>,
    fields: readonly string[],
  ) => form.trigger(fields as never);

  return (
    <FormDialog<CompanyOnboardingFormData>
      open={open}
      onClose={() => {
        setStep(1);
        onClose();
      }}
      title={t("onboard.title")}
      description={t("onboard.description")}
      schema={CompanyOnboardingSchema}
      defaultValues={EMPTY_ONBOARDING}
      submitLabel={t("onboard.submit")}
      submitVariant="gold"
      className="max-w-2xl"
      onSubmit={(values) => onboard.mutateAsync(values)}
      renderFooter={(form) => (
        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={
              step === 1
                ? () => {
                    setStep(1);
                    onClose();
                  }
                : () => setStep(1)
            }
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-border-strong bg-transparent px-4 py-2 text-sm font-medium text-content transition-colors hover:bg-surface-hover"
          >
            {step === 1 ? (
              t("cancel", { ns: "common" })
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}
            {step === 1 ? null : t("onboard.previous")}
          </button>

          {step === 1 ? (
            <button
              type="button"
              onClick={async () => {
                if (
                  await validateStep(
                    form,
                    COMPANY_FIELDS as unknown as string[],
                  )
                ) {
                  setStep(2);
                }
              }}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm bg-gradient-to-br from-accent-400 to-accent-600 px-4 py-2 text-sm font-medium text-primary-950 shadow-[0_4px_14px_rgba(201,146,46,0.28)] transition-all hover:brightness-105"
            >
              {t("onboard.next")}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm bg-primary-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {form.formState.isSubmitting
                ? t("loading", { ns: "common" })
                : t("onboard.submit")}
            </button>
          )}
        </div>
      )}
    >
      {({ control }) => (
        <div className="max-h-[min(70vh,640px)] overflow-y-auto pr-1">
          <StepIndicator step={step} />

          {step === 1 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface-secondary p-4">
                <div className="mb-4 flex items-start gap-3">
                  <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-600 dark:text-accent-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-content">
                      {t("onboard.companySection")}
                    </h3>
                    <p className="mt-1 text-xs text-content-muted">
                      {t("onboard.companyHint")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField
                    name="companyName"
                    control={control}
                    label={t("fields.companyName")}
                    required
                  />
                  <FormField
                    name="addressLine1"
                    control={control}
                    label={t("fields.addressLine1")}
                  />
                  <FormField
                    name="addressLine2"
                    control={control}
                    label={t("fields.addressLine2")}
                  />
                  <CountryField
                    name="country"
                    control={control}
                    label={t("fields.country")}
                    helperText={t("onboard.countryHint")}
                  />
                  <FormField
                    name="city"
                    control={control}
                    label={t("fields.city")}
                  />
                  <FormField
                    name="companyEmail"
                    control={control}
                    label={t("fields.companyEmail")}
                    type="email"
                  />
                  <PhoneField
                    name="companyPhone"
                    countryFieldName="country"
                    control={control}
                    label={t("fields.companyPhone")}
                  />
                </div>
              </div>

              <p className="text-xs text-content-muted">
                {t("onboard.requiredHint")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface-secondary p-4">
                <div className="mb-4 flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-600 dark:text-accent-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-content">
                      {t("onboard.adminSection")}
                    </h3>
                    <p className="mt-1 text-xs text-content-muted">
                      {t("onboard.adminHint")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField
                    name="adminFirstName"
                    control={control}
                    label={t("fields.adminFirstName")}
                    required
                  />
                  <FormField
                    name="adminLastName"
                    control={control}
                    label={t("fields.adminLastName")}
                    required
                  />
                  <FormField
                    name="adminLogin"
                    control={control}
                    label={t("fields.adminLogin")}
                    helperText={t("onboard.loginHint")}
                    required
                  />
                  <FormField
                    name="adminPassword"
                    control={control}
                    label={t("fields.adminPassword")}
                    type="password"
                    required
                  />
                  <PhoneField
                    name="adminPhone"
                    countryFieldName="country"
                    control={control}
                    label={t("fields.adminPhone")}
                  />
                </div>
              </div>

              <p className="text-xs text-content-muted">
                {t("onboard.requiredHint")}
              </p>
            </div>
          )}
        </div>
      )}
    </FormDialog>
  );
}

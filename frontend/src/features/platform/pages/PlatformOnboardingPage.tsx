import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FormField } from "@/components/forms/FormFields";
import { CountryField, PhoneField } from "@/components/forms/LocationFields";
import { extractFieldErrors } from "@/api/interceptors";
import { getFieldErrors } from "@/lib/error-handler";
import { langPath } from "@/lib/lang-path";
import {
  CompanyOnboardingSchema,
  EMPTY_ONBOARDING,
  type CompanyOnboardingFormData,
} from "../schemas";
import { useOnboardCompany } from "../hooks";

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
    <nav aria-label={t("onboard.stepsLabel")} className="mb-6">
      <ol className="grid grid-cols-2 gap-3">
        {[
          { number: 1, icon: Building2, label: t("onboard.companyStep") },
          { number: 2, icon: ShieldCheck, label: t("onboard.adminStep") },
        ].map(({ number, icon: Icon, label }) => {
          const active = step === number;
          const complete = step > number;

          return (
            <li
              key={number}
              className={`flex items-center gap-3 rounded-lg border px-3 py-3 transition-colors sm:px-4 ${
                active
                  ? "border-primary-950 bg-primary-950 text-white dark:border-primary-900 dark:bg-primary-900"
                  : complete
                    ? "border-accent-500/50 bg-accent-100/60 text-content dark:bg-accent-500/10"
                    : "border-border bg-surface-secondary text-content-muted"
              }`}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  active
                    ? "bg-white text-primary-950"
                    : complete
                      ? "bg-accent-500 text-primary-950"
                      : "bg-surface text-content-muted"
                }`}
              >
                {complete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] uppercase tracking-wide opacity-75">
                  {t("onboard.step", { number })}
                </span>
                <span className="block truncate text-sm font-semibold">
                  {label}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export const PlatformOnboardingPage = () => {
  const { t } = useTranslation("platform");
  const navigate = useNavigate();
  const onboard = useOnboardCompany();
  const [step, setStep] = useState<Step>(1);
  const form = useForm<CompanyOnboardingFormData>({
    resolver: zodResolver(
      CompanyOnboardingSchema,
    ) as unknown as Resolver<CompanyOnboardingFormData>,
    defaultValues: EMPTY_ONBOARDING,
    mode: "onTouched",
  });

  useEffect(() => {
    form.reset(EMPTY_ONBOARDING);
  }, [form]);

  const goBack = () => navigate(langPath("/platform"));

  const validateStep = async (fields: readonly string[]) =>
    form.trigger(fields as never);

  const handleSubmit = async (values: CompanyOnboardingFormData) => {
    try {
      await onboard.mutateAsync(values);
      navigate(langPath("/platform/companies"));
    } catch (error) {
      const fieldErrors = {
        ...extractFieldErrors(error),
        ...getFieldErrors(error),
      };
      (
        Object.keys(fieldErrors) as Array<keyof CompanyOnboardingFormData>
      ).forEach((field) => {
        form.setError(field, { type: "server", message: fieldErrors[field] });
      });
      throw Object.assign(
        error instanceof Object ? error : new Error(String(error)),
        { handled: true },
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[11.5px] uppercase tracking-[0.13em] text-accent-600">
            {t("eyebrow")}
          </p>
          <h1 className="mt-1.5 font-display text-[26px] font-semibold text-content sm:text-[30px]">
            {t("onboard.title")}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-content-muted">
            {t("onboard.description")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          className="self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("onboard.cancel")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <StepIndicator step={step} />

          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
              <fieldset
                disabled={form.formState.isSubmitting}
                className="space-y-6"
              >
                {step === 1 ? (
                  <div className="space-y-5">
                    <div className="flex items-start gap-3 border-b border-border pb-4">
                      <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-600 dark:text-accent-400" />
                      <div>
                        <h2 className="text-base font-semibold text-content">
                          {t("onboard.companySection")}
                        </h2>
                        <p className="mt-1 text-sm text-content-muted">
                          {t("onboard.companyHint")}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <FormField
                        name="companyName"
                        control={form.control}
                        label={t("fields.companyName")}
                        required
                      />
                      <FormField
                        name="addressLine1"
                        control={form.control}
                        label={t("fields.addressLine1")}
                      />
                      <FormField
                        name="addressLine2"
                        control={form.control}
                        label={t("fields.addressLine2")}
                      />
                      <CountryField
                        name="country"
                        control={form.control}
                        label={t("fields.country")}
                        helperText={t("onboard.countryHint")}
                      />
                      <FormField
                        name="city"
                        control={form.control}
                        label={t("fields.city")}
                      />
                      <FormField
                        name="companyEmail"
                        control={form.control}
                        label={t("fields.companyEmail")}
                        type="email"
                      />
                      <PhoneField
                        name="companyPhone"
                        countryFieldName="country"
                        control={form.control}
                        label={t("fields.companyPhone")}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-start gap-3 border-b border-border pb-4">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-600 dark:text-accent-400" />
                      <div>
                        <h2 className="text-base font-semibold text-content">
                          {t("onboard.adminSection")}
                        </h2>
                        <p className="mt-1 text-sm text-content-muted">
                          {t("onboard.adminHint")}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <FormField
                        name="adminFirstName"
                        control={form.control}
                        label={t("fields.adminFirstName")}
                        required
                      />
                      <FormField
                        name="adminLastName"
                        control={form.control}
                        label={t("fields.adminLastName")}
                        required
                      />
                      <FormField
                        name="adminLogin"
                        control={form.control}
                        label={t("fields.adminLogin")}
                        helperText={t("onboard.loginHint")}
                        required
                      />
                      <FormField
                        name="adminPassword"
                        control={form.control}
                        label={t("fields.adminPassword")}
                        type="password"
                        required
                      />
                      <PhoneField
                        name="adminPhone"
                        countryFieldName="country"
                        control={form.control}
                        label={t("fields.adminPhone")}
                      />
                    </div>
                  </div>
                )}

                <p className="text-xs text-content-muted">
                  {t("onboard.requiredHint")}
                </p>

                <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={step === 1 ? goBack : () => setStep(1)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {step === 1 ? t("onboard.cancel") : t("onboard.previous")}
                  </Button>

                  {step === 1 ? (
                    <Button
                      type="button"
                      variant="gold"
                      onClick={async () => {
                        if (await validateStep(COMPANY_FIELDS)) setStep(2);
                      }}
                    >
                      {t("onboard.next")}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="gold"
                      loading={form.formState.isSubmitting}
                    >
                      {t("onboard.submit")}
                    </Button>
                  )}
                </div>
              </fieldset>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
};

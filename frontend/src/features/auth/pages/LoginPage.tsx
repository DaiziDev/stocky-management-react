import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthSchema, type AuthFormData } from "../schemas";
import { useLogin } from "../hooks";
import { extractErrorMessage } from "@/api/interceptors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { LogoMark } from "@/components/ui/LogoMark";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { currentLang } from "@/lib/lang-path";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Package,
  TrendingUp,
  User,
} from "lucide-react";
import { useState } from "react";

/* Mockup login §login: split 50/50 — dark-ink marketing panel (orbs, grid,
   floating stat cards) + centered form. Panel hidden <md; mobile shows the
   brand row above the form. Staggered rise-in entrances, dark-teal CTA. */

/** Locale-aware number formatting ("4 830" fr / "4,830" en, "99,2" vs "99.2"). */
const fmt = (n: number): string =>
  n.toLocaleString(currentLang() === "en" ? "en-US" : "fr-FR");

const FLOAT_CARDS = [
  {
    id: "fc1",
    icon: TrendingUp,
    prefix: "+",
    value: 12,
    suffix: "%",
    labelKey: "statWeeklySales",
    left: 0,
    top: 6,
    delay: "0.55s, 0.55s",
    iconClass: "bg-success-500/25 text-success-500",
  },
  {
    id: "fc2",
    icon: Package,
    prefix: "",
    value: 4830,
    suffix: "",
    labelKey: "statArticlesTracked",
    left: 150,
    top: 78,
    delay: "1.4s, 0.72s",
    iconClass: "bg-accent-500/25 text-accent-400",
  },
  {
    id: "fc3",
    icon: CheckCircle2,
    prefix: "",
    value: 99.2,
    suffix: "%",
    labelKey: "statAvailability",
    left: 300,
    top: 14,
    delay: "0.9s, 0.9s",
    iconClass: "bg-info-500/25 text-info-500",
  },
] as const;

const STATS = [
  { value: 12, labelKey: "statCompanies" },
  { value: 4830, labelKey: "statArticlesTracked" },
  { value: 18, labelKey: "statUsers" },
] as const;

export const LoginPage = () => {
  const { t } = useTranslation("auth");
  const { mutate: login, isPending } = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(AuthSchema),
    defaultValues: { login: "", motDePasse: "" },
  });

  const onSubmit = (data: AuthFormData) => {
    setServerError(null);
    login(data, {
      onError: (err) => {
        setServerError(
          extractErrorMessage(err) || t("errors.invalidCredentials"),
        );
      },
    });
  };

  return (
    <div className="relative flex min-h-screen bg-background">
      {/* ── Brand panel (hidden < md, per mockup ≤640 rule adapted) ── */}
      <div
        aria-hidden="true"
        className="relative hidden flex-col justify-between overflow-hidden p-8 text-[var(--dark-text-primary)] md:flex md:w-1/2 lg:p-[52px]"
        style={{
          background:
            "radial-gradient(120% 100% at 15% 0%, var(--color-primary-800) 0%, var(--color-primary-900) 46%, var(--color-primary-950) 100%)",
        }}
      >
        <div
          className="login-orb"
          style={{
            width: 360,
            height: 360,
            background: "var(--dark-primary)",
            top: -120,
            right: -100,
          }}
        />
        <div
          className="login-orb"
          style={{
            width: 280,
            height: 280,
            background: "var(--color-accent-500)",
            bottom: -80,
            left: -60,
            opacity: 0.28,
            animationDelay: "-4s",
          }}
        />
        <div className="login-grid-overlay" />

        {/* Top — brand */}
        <div className="relative z-[2] flex items-center gap-[11px]">
          <LogoMark />
          <b className="font-display text-xl font-semibold tracking-[0.01em]">
            SGS
          </b>
        </div>

        {/* Middle — headline + floating stat cards */}
        <div className="relative z-[2] max-w-[430px]">
          <span
            className="rise-in inline-flex items-center gap-2 font-mono text-[11.5px] uppercase tracking-[0.16em] text-accent-400"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-success-500 shadow-[0_0_0_3px_rgba(30,154,85,0.25)]" />
            {t("heroKicker")}
          </span>

          {/* max-w + size tuned so FR wraps exactly like the mockup:
              « Chaque article / compté, / chaque mouvement / tracé. » */}
          <h1
            className="rise-in mt-[22px] whitespace-pre-line font-display text-[48px] font-semibold leading-[1.08] tracking-[-0.01em] text-white"
            style={{ animationDelay: "0.22s" }}
          >
            {t("heroTitle")}
          </h1>

          <p
            className="rise-in mt-[18px] max-w-[420px] text-[15.5px] leading-[1.65] text-[var(--dark-text-secondary)]"
            style={{ animationDelay: "0.38s" }}
          >
            {t("heroBody")}
          </p>

          <div className="relative z-[2] mt-2 h-[150px]">
            {FLOAT_CARDS.map(
              ({
                id,
                icon: Icon,
                prefix,
                value,
                suffix,
                labelKey,
                left,
                top,
                delay,
                iconClass,
              }) => (
                <div
                  key={id}
                  className="float-card"
                  style={{ left, top, animationDelay: delay }}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] ${iconClass}`}
                  >
                    <Icon className="h-[17px] w-[17px]" aria-hidden="true" />
                  </div>
                  <div>
                    <b>
                      {prefix}
                      {fmt(value)}
                      {suffix}
                    </b>
                    <span>{t(labelKey)}</span>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Bottom — stats */}
        <div
          className="rise-in relative z-[2] flex gap-10"
          style={{ animationDelay: "0.5s" }}
        >
          {STATS.map(({ value, labelKey }) => (
            <div key={labelKey}>
              <b className="block font-mono text-2xl text-white">
                {fmt(value)}
              </b>
              <span className="text-xs text-[var(--dark-text-muted)]">
                {t(labelKey)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Language switcher — fixed to the viewport's top-right corner. */}
      <div className="absolute right-4 top-4 z-20 md:right-10 md:top-10">
        <LanguageSwitcher />
      </div>

      {/* ── Form side ── */}
      <div className="flex w-full items-center justify-center bg-surface p-6 md:w-1/2 md:p-10">
        <div
          className="rise-in relative w-full max-w-[470px]"
          style={{ animationDelay: "0.18s" }}
        >
          {/* Mobile brand row */}
          <div className="mb-7 flex items-center gap-2.5 md:hidden">
            <LogoMark />
            <b className="font-display text-lg font-semibold text-content">
              SGS
            </b>
          </div>

          <h2 className="font-display text-[34px] font-bold text-content">
            {t("title")}
          </h2>
          <p className="mb-[30px] mt-1.5 text-[15.5px] text-content-secondary">
            {t("subtitle")}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[17px]">
            {serverError && (
              <div className="flex items-center gap-2 rounded-[9px] border border-danger-500/30 bg-danger-100 p-3 text-sm text-danger-700 dark:bg-danger-500/10 dark:text-danger-500">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <div>
              <Label htmlFor="login" required>
                {t("loginField")}
              </Label>
              <Input
                id="login"
                type="text"
                autoComplete="username"
                placeholder="admin@sgs.local"
                leadingIcon={<User />}
                error={errors.login?.message}
                className="h-12"
                {...register("login")}
                disabled={isPending}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" required>
                  {t("password")}
                </Label>
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                leadingIcon={<Lock />}
                error={errors.motDePasse?.message}
                className="h-12"
                {...register("motDePasse")}
                disabled={isPending}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? t("hidePassword") : t("showPassword")
                    }
                    aria-pressed={showPassword}
                    className="rounded-sm p-1.5 text-content-muted transition-colors hover:text-content"
                  >
                    {showPassword ? (
                      <EyeOff
                        className="h-[18px] w-[18px]"
                        aria-hidden="true"
                      />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
                    )}
                  </button>
                }
              />
            </div>

            {/* Dark-teal CTA per mockup (overrides the primary bg via twMerge). */}
            <Button
              type="submit"
              variant="form"
              className="w-full py-3"
              loading={isPending}
            >
              {isPending ? t("loading") : t("loginButton")}
            </Button>

            <p className="pt-1 text-center text-[13px] text-content-muted">
              {t("demoNote")}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

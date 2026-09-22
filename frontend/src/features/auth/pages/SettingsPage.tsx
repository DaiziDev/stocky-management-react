import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { currentLang } from "@/lib/lang-path";

export const SettingsPage = () => {
  const { t } = useTranslation("auth");
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();

  /** Language switching = URL navigation (LangGuard applies it to i18n). */
  const switchTo = (code: string) => {
    if (code === currentLang()) return;
    const rest = window.location.pathname.split("/").slice(2).join("/");
    navigate(`/${code}${rest ? `/${rest}` : ""}${window.location.search}`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-content">{t("settingsTitle")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("appearance")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-content-secondary">
              {t("theme")}
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: "light", label: t("light"), icon: Sun },
                { value: "dark", label: t("dark"), icon: Moon },
                { value: "system", label: t("system"), icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setMode(value as "light" | "dark" | "system")}
                  className={`rounded-lg border-2 p-4 transition-colors ${
                    mode === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-border-strong"
                  }`}
                >
                  <Icon className="mx-auto mb-2 h-6 w-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-content-secondary">
              {t("language")}
            </label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { code: "fr", label: "Français", flag: "🇫🇷" },
                { code: "en", label: "English", flag: "🇺🇸" },
              ].map(({ code, label, flag }) => (
                <button
                  key={code}
                  onClick={() => switchTo(code)}
                  className={`rounded-lg border-2 p-4 transition-colors ${
                    currentLang() === code
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-border-strong"
                  }`}
                >
                  <span className="mb-2 block text-2xl" aria-hidden="true">
                    {flag}
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

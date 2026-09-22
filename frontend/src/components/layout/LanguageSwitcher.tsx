import { Globe, ChevronDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { currentLang } from "@/lib/lang-path";

const languages = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
] as const;

/**
 * Language dropdown. The URL segment (/:lang) is the source of truth, so
 * switching = navigate to the SAME path under the target language; LangGuard
 * applies it to i18n and i18n persists the choice to localStorage.
 */
export const LanguageSwitcher = () => {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const location = useLocation();
  const currentLangCode = currentLang();

  const switchTo = (code: string) => {
    if (code === currentLangCode) return;
    // Strip the current /:lang segment, keep the rest of the path + query + hash.
    const rest = location.pathname.split("/").slice(2).join("/");
    navigate(
      `/${code}${rest ? `/${rest}` : ""}${location.search}${location.hash}`,
    );
  };

  const current =
    languages.find((l) => l.code === currentLangCode) ?? languages[0];

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex h-9 items-center justify-center gap-2 rounded-[9px] px-2 text-content-secondary transition-colors hover:bg-surface-hover"
        aria-label={t("layout.changeLanguage")}
        aria-haspopup="true"
      >
        <Globe className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">{current.flag}</span>
        <span className="hidden font-medium text-content-secondary md:inline">
          {current.label}
        </span>
        <ChevronDown
          className="hidden h-4 w-4 text-content-muted sm:block"
          aria-hidden="true"
        />
      </button>

      <div className="invisible absolute right-0 top-full z-50 mt-2 w-40 translate-y-1 rounded-[14px] border border-border bg-surface py-1.5 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        {languages.map(({ code, label, flag }) => (
          <button
            key={code}
            type="button"
            onClick={() => switchTo(code)}
            className={`flex w-full items-center gap-2 px-4 py-2 text-[13.6px] transition-colors ${
              currentLangCode === code
                ? "bg-accent-500/15 text-content"
                : "text-content-secondary hover:bg-surface-hover hover:text-content"
            }`}
          >
            <span className="text-lg">{flag}</span>
            <span>{label}</span>
            {currentLangCode === code && (
              <span className="ml-auto text-accent-500">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

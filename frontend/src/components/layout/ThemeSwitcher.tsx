import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/providers/ThemeProvider";

export const ThemeSwitcher = () => {
  const { t } = useTranslation("common");
  const { resolvedTheme, setMode } = useTheme();
  const isDark = resolvedTheme === "dark";
  const nextMode = isDark ? "light" : "dark";
  const label = isDark ? t("layout.themeLight") : t("layout.themeDark");

  return (
    <button
      type="button"
      onClick={() => setMode(nextMode)}
      className="flex h-9 w-9 items-center justify-center rounded-[9px] text-content-secondary transition-colors hover:bg-surface-hover"
      aria-label={label}
      title={label}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-accent-500" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5 text-accent-500" aria-hidden="true" />
      )}
    </button>
  );
};

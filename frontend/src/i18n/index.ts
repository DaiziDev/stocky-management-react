import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { globalResources } from "./resources";

/**
 * Feature translations — eagerly bundled from each feature's translations
 * folder (src/features/<name>/translations with fr.json / en.json files).
 * New features pick up their translations automatically by dropping files in
 * that folder (no registration needed).
 */
const featureResources = import.meta.glob<{ default: Record<string, unknown> }>(
  "../features/*/translations/*.json",
  { eager: true },
);

for (const [path, module] of Object.entries(featureResources)) {
  const match = path.match(/features\/([^/]+)\/translations\/(fr|en)\.json$/);
  if (match) {
    const [, namespace, lng] = match as [string, string, string];
    const bundle = globalResources as Record<string, Record<string, unknown>>;
    bundle[lng] = bundle[lng] ?? {};
    bundle[lng][namespace] = module.default;
  }
}

export const SUPPORTED_LANGS = ["fr", "en"] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: AppLang = "fr";

export const isAppLang = (value: string | undefined): value is AppLang =>
  !!value && (SUPPORTED_LANGS as readonly string[]).includes(value);

/**
 * Initial language resolution order:
 *   1. URL path segment  (/fr/…, /en/…) — the source of truth, set by the
 *      router's LangGuard on every navigation.
 *   2. Previously chosen language persisted in localStorage.
 *   3. French (the app's primary locale).
 *
 * The LanguageDetector is gone: the URL drives the language now. The
 * navigator language is deliberately NOT consulted — any real navigation
 * carries a /:lang segment (or is redirected to one), and a navigator-based
 * guess would flash the wrong language on URLs that bypass LangGuard
 * (e.g. the unprefixed 404 catch-all).
 */
function resolveInitialLanguage(): AppLang {
  const fromUrl = window.location.pathname.split("/")[1];
  if (isAppLang(fromUrl)) return fromUrl;

  const stored = localStorage.getItem("i18nextLng") ?? undefined;
  if (isAppLang(stored)) return stored;

  return DEFAULT_LANG;
}

const initialLang = resolveInitialLanguage();

i18n.use(initReactI18next).init({
  lng: initialLang,
  fallbackLng: DEFAULT_LANG,
  supportedLngs: SUPPORTED_LANGS,
  defaultNS: "common",
  ns: [
    "common",
    "auth",
    "dashboard",
    "platform",
    "articles",
    "customers",
    "suppliers",
    "orders",
    "stock",
    "sales",
    "notifications",
    "users",
    "companies",
    "categories",
  ],

  interpolation: {
    escapeValue: false,
  },

  react: {
    useSuspense: false,
  },

  resources: globalResources,
});

// Persist every language change so a reload (and api/client.ts's hard
// redirect to /login) can restore the choice before the router boots.
i18n.on("languageChanged", (lng) => {
  if (isAppLang(lng)) {
    localStorage.setItem("i18nextLng", lng);
  }
});

export default i18n;

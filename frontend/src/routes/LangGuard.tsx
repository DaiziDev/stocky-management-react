import { Navigate, Outlet, useLocation, useParams } from "react-router";
import { useEffect } from "react";
import i18n, { isAppLang } from "@/i18n";
import { legacyTarget } from "@/lib/lang-path";

/**
 * URL language segment guard — the single place that binds the URL to i18n.
 *
 * Every route lives under /:lang (fr | en). This guard:
 *   1. redirects unknown/absent segments to the same path under the resolved
 *      language (/catalog → /fr/catalog, /en/xyz → /fr/xyz for a bad segment);
 *   2. applies the segment to i18n on every navigation, so back/forward
 *      history buttons switch the language exactly like the switcher does.
 */
export const LangGuard = () => {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();

  const valid = isAppLang(lang);

  useEffect(() => {
    if (valid && lang && i18n.language !== lang) {
      void i18n.changeLanguage(lang);
    }
  }, [valid, lang]);

  if (!valid) {
    return (
      <Navigate
        to={legacyTarget(location.pathname, location.search, location.hash)}
        replace
      />
    );
  }

  return <Outlet />;
};

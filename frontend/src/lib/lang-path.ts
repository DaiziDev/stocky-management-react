import { isAppLang, DEFAULT_LANG } from "@/i18n";

/**
 * Current UI language as segmented in the URL (fr | en), with the app default
 * as fallback (e.g. the '*' catch-all 404 route has no /:lang prefix).
 */
export function currentLang(): string {
  const seg = window.location.pathname.split("/")[1];
  return isAppLang(seg) ? seg : DEFAULT_LANG;
}

/**
 * Prefix an app-absolute path with the current URL language segment.
 * langPath('/dashboard') → '/fr/dashboard'. All programmatic navigation and
 * internal <Link>s must go through this so the language survives the jump.
 */
export function langPath(path: string): string {
  return `/${currentLang()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Target for redirecting a legacy/unprefixed URL into the /:lang scheme.
 *
 * If the first path segment looks like an IETF language tag (2–3 letters,
 * optionally followed by a region subtag — e.g. "de", "pt-BR") but is not a
 * supported language, it is DROPPED (/de/login → /fr/login). Any other first
 * segment ("login", "catalog", …) is kept whole (/catalog/articles →
 * /fr/catalog/articles). Used by LangGuard and the router's catch-all.
 */
const LANG_TAG_RE = /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i;

export function legacyTarget(pathname: string, search = "", hash = ""): string {
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length > 0 && !isAppLang(segs[0]) && LANG_TAG_RE.test(segs[0])) {
    segs.shift();
  }
  return `/${DEFAULT_LANG}${segs.length > 0 ? `/${segs.join("/")}` : ""}${search}${hash}`;
}

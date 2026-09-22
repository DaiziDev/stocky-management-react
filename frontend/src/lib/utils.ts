import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CURRENCY, LOCALE } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Money, in the app's currency unless one is passed explicitly.
 *
 * The fraction-digit count is deliberately left to Intl: it knows each
 * currency's real precision (EUR → 2 decimals, XAF → 0). Hard-coding 2 used
 * to print "706 664,00 FCFA", which is not how francs CFA are written.
 */
export function formatCurrency(
  amount: number,
  currency: string = CURRENCY,
  locale: string = LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * How the currency is written next to an amount. Intl knows the local
 * convention (XAF → "FCFA" in French, EUR → "€"); the code is the fallback.
 */
export function currencySymbol(currency: string = CURRENCY): string {
  try {
    const parts = new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency,
    }).formatToParts(0);
    return parts.find((part) => part.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}

/** How many decimals this currency actually uses (EUR → 2, XAF → 0). */
export function currencyDecimals(currency: string = CURRENCY): number {
  try {
    return (
      new Intl.NumberFormat(LOCALE, {
        style: "currency",
        currency,
      }).resolvedOptions().maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

export function formatNumber(value: number, locale = "fr-FR"): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions,
  locale = "fr-FR",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(d);
}

export function formatDateTime(date: string | Date, locale = "fr-FR"): string {
  return formatDate(date, { hour: "2-digit", minute: "2-digit" }, locale);
}

export function formatRelativeTime(
  date: string | Date,
  locale = "fr-FR",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "à l'instant";
  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours} h`;
  if (diffDays < 7) return `il y a ${diffDays} j`;
  return formatDate(d, {}, locale);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

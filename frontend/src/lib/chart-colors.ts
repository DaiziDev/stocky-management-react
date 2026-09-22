/**
 * Token-only color rule (P8 visual QA) — maps the mockup's hard-coded hex
 * values to their `--color-*` design tokens (styles/tokens.css). Components
 * must reference tokens, never raw hex values, so dark mode + re-branding
 * stay single-source. Exported for recharts, which takes JS color strings
 * (CSS `var()` references are valid there — the SVG resolves them at paint).
 *
 * NOTE: only steps that exist in BOTH themes are used. The dark theme
 * overrides accent-500/primary-500/surfaces/text; 400-steps are light-only,
 * so the palette pairs a light-theme step with its dark override via
 * `.dark`-scoped rules is avoided here — components pick per theme using
 * `useThemeStore().resolvedTheme`.
 */
export const chartColors = {
  /** Accent-500 — overridden to dark-accent in dark theme by tokens.css. */
  gold: "var(--color-accent-500)",
  /** Primary-700 (#2A6264); dark theme: primary-600 (#4F8584-ish teal lift). */
  teal: "var(--color-primary-700)",
  green: "var(--color-success-500)",
  blue: "var(--color-info-500)",
  red: "var(--color-danger-500)",
  amber: "var(--color-warning-500)",
  /** Muted chart ticks — text-muted token. */
  tick: "var(--color-text-muted)",
  /** Grid lines derive from the text token at low alpha. */
  grid: "color-mix(in srgb, var(--color-text-primary) 7%, transparent)",
  /** Soft cursor highlight — accent at 8% alpha. */
  cursor: "color-mix(in srgb, var(--color-accent-500) 8%, transparent)",
} as const;

/** Donut palette — brand-first ordering from the mockup §view-dashboard. */
export const donutPalette = [
  chartColors.gold,
  chartColors.teal,
  chartColors.green,
  chartColors.blue,
  chartColors.red,
  chartColors.amber,
  "var(--color-primary-500)",
  "var(--color-accent-300)",
] as const;

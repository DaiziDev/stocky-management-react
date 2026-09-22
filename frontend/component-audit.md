# SGS — Global Component Analysis & Audit

**Source design:** `public/SGS_maquette_demo (1).html` (v2 design tokens, light-only mockup)
**Codebase:** `sgs-app` (React 19 + TS + Vite + Tailwind CSS v4, feature-based architecture)
**Date:** 2026-09-16 · **Implementation update:** 2026-09-21

> The audit below began as a gap analysis against the static design. The implementation has since completed the major shared UI and feature work listed in this update. Where the historical specifications below still say “Needs Creation” or “placeholder”, the current repository status takes precedence.

## Current implementation status

- **Design system:** token-based SGS palette is active in light and dark mode. Gold primary CTAs are used for creation actions; danger red is used for delete hover and confirmation actions.
- **Shell and forms:** responsive header/sidebar/layout, dialogs, translated forms and dark-mode surfaces are in use. Customer and supplier forms are single-column; their phone input is a shared composite country-code + number control.
- **Tables:** the shared `DataTable` supports filtering, sorting, active-page pagination, centered pagination controls, empty/loading states and optional keyboard-accessible row clicks. The pagination bug where rows from page two appeared on page one is fixed.
- **Feature pages:** articles, categories, companies, users, customers and suppliers have implemented API-backed pages and forms. Articles include stock status and status filtering; optional empty photos no longer block edits.
- **Orders:** customer and supplier order creation, status filters, detail pages, row-click navigation and lifecycle actions are implemented against the Swagger endpoints. Customer orders validate/ship/deliver/cancel; supplier orders receive/partially receive/cancel.
- **Contract verification:** list APIs no longer send undocumented query parameters or envelope types. VAT conversion is verified live (`vatRate` decimal in the domain, `tauxTva` percentage on the wire).
- **Verification:** TypeScript typecheck passes; the current unit/component suite reports 111 passing tests, with live tests opt-in.

### Current reference implementation

For the catalogue table, the intended implemented pattern is: page eyebrow and title, responsive gold “Nouvel article” action, search/filter toolbar, token-based table surface, status/stock badges, edit/delete row actions and shared pagination. The same interaction and styling rules are reused by the other CRUD and order tables.

---

## 1. Cross-Cutting Findings (blockers to fix first)

These issues affect **every** component below and must be resolved before/during component work.

### 1.1 Missing Tailwind v4 `@theme` mapping — CRITICAL

Tailwind v4 is CSS-first: utilities like `bg-primary`, `text-primary`, `ring-primary` are only generated
if the corresponding variables are declared inside an `@theme` block. `src/styles/tokens.css` declares
`--color-primary-*`, `--color-accent-*`, etc. in plain `:root` — **no `@theme` block exists anywhere**
(verified: `grep "@theme"` → 0 matches).

Consequences:

- `bg-primary`, `hover:bg-primary-hover`, `focus:ring-primary` used in `Button.tsx`, `Input.tsx`, `Sidebar.tsx`, `Header.tsx`, `FeedbackStates.tsx`, feature pages → **silently render nothing**.
- `--color-primary-hover` is referenced but **defined nowhere**.

**Required action** — add to `src/styles/index.css` (or `tokens.css`):

```css
@theme inline {
  --color-primary: var(--color-primary-800);
  --color-primary-hover: var(--color-primary-700);
  --color-accent: var(--color-accent-500);
  --color-surface: var(--color-surface);
  --color-surface-alt: var(--color-surface-secondary);
  --color-border-app: var(--color-border);
  /* + font families below */
}
```

### 1.2 Missing fonts — CRITICAL for design parity

The mockup uses three families; `index.html` loads **no webfonts** and tokens define only Inter + JetBrains Mono.

| Mockup                     | Role                                             | Required action                                                                    |
| -------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `Fraunces` (450–700, opsz) | Display/headings, card titles, page titles, logo | Add `<link>` in `index.html`; add `--font-display` token + `@theme --font-display` |
| `Inter`                    | Body/UI                                          | Already in tokens — load via webfont link (currently system fallback)              |
| `IBM Plex Mono`            | Prices, codes, KPI values, eyebrows              | Add to `--font-mono` stack (or replace JetBrains Mono) + webfont link              |

### 1.3 Color parity (mockup → project tokens)

| Mockup token                    | Hex       | Project token                                       | Hex       | Verdict                           |
| ------------------------------- | --------- | --------------------------------------------------- | --------- | --------------------------------- |
| `--ink-950`                     | `#0A1E20` | `--color-primary-950`                               | `#0b2426` | ≈ match, keep project value       |
| `--ink-800`                     | `#173A3E` | `--color-primary-800`                               | `#173a3e` | exact match                       |
| `--gold-500`                    | `#C9922E` | `--color-accent-500`                                | `#c9922e` | exact match                       |
| `--gold-100`                    | `#FBF0DC` | `--color-accent-100`                                | `#fbf1d8` | ≈ match                           |
| `--bg`                          | `#F6F7F8` | `--color-background`                                | `#f7f8f6` | ≈ match                           |
| `--success / --danger / --info` |           | `--color-success-500` / `-danger-500` / `-info-500` |           | ≈ match (project has full scales) |

No token changes needed for color — only for the `@theme` mapping and fonts.

### 1.4 Raw Tailwind gray palette vs tokens

All existing components use `gray-*` / `green-*` / `red-*` / `blue-*` default-palette classes
(`bg-gray-100`, `text-gray-500`, `dark:bg-gray-800`, …) instead of the SGS token system. This makes
dark mode "generic dark gray" instead of the SGS teal-ink palette and prevents brand parity.
**Migration rule for all updates below:** replace `gray-*` with token-driven utilities
(`bg-surface`, `bg-surface-alt`, `text-text-primary`, `border-border-app`, …) once 1.1 is done.

### 1.5 Dark mode

The mockup is **light-only**. The project already has the right infrastructure
(`tokens.css` dark mapping, `.dark` class strategy via `@custom-variant dark`, `theme.store.ts` with
light/dark/system + persistence). Every component spec below therefore derives dark styling from the
existing `--dark-*` tokens. One structural note: the **Sidebar is dark-ink in both themes** (by design),
so it must not rely on `dark:` variants.

### 1.6 Breakpoint reference (from mockup, to standardize)

| Breakpoint              | Behavior                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| ≥1181px (desktop)       | KPI grid 4-col, dash-grid 2-col, POS 2-col, sidebar fixed                                                                                        |
| ≤1180px (small desktop) | KPI 2-col, dash-grid 1-col                                                                                                                       |
| ≤900px (tablet)         | Sidebar off-canvas + backdrop + hamburger, topbar full-width, POS stacks, cart unsticks                                                          |
| ≤640px (mobile)         | KPI 1-col, page-head stacks, login single-column, **modal becomes bottom sheet**, field rows 1-col, line-item total hidden, company label hidden |
| ≤420px (small mobile)   | Toasts full-width                                                                                                                                |

`index.css` already implements 900/640/420 for page containers; **1180 is missing** and must be added.

---

## 2. Component Inventory (summary)

| #   | Component                                      | Architecture path                                                                      | Status                                 |
| --- | ---------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------- |
| 1   | Design tokens + Tailwind theme mapping         | `src/styles/tokens.css`, `src/styles/index.css`, `index.html`                          | 🔴 Needs Updates                       |
| 2   | LogoMark                                       | `src/components/ui/LogoMark.tsx`                                                       | 🟡 Needs Creation                      |
| 3   | Avatar                                         | `src/components/ui/Avatar.tsx`                                                         | 🟡 Needs Creation                      |
| 4   | Button                                         | `src/components/ui/Button.tsx`                                                         | 🔴 Needs Updates                       |
| 5   | IconButton                                     | `src/components/ui/IconButton.tsx`                                                     | 🟡 Needs Creation                      |
| 6   | Badge / StatusBadge                            | `src/components/ui/Badge.tsx`                                                          | 🔴 Needs Updates                       |
| 7   | Card suite                                     | `src/components/ui/Card.tsx`                                                           | 🔴 Needs Updates                       |
| 8   | PageHeader                                     | `src/components/layout/PageHeader.tsx`                                                 | 🟡 Needs Creation                      |
| 9   | Dialog / Modal                                 | `src/components/ui/Dialog.tsx`                                                         | 🔴 Needs Updates                       |
| 10  | Toast                                          | `src/app/providers.tsx` (sonner config)                                                | 🟠 Needs Updates (minor)               |
| 11  | Table suite + RowActions                       | `src/components/ui/Table.tsx`                                                          | 🔴 Needs Updates                       |
| 12  | EmptyState / Loading / Skeleton                | `src/components/feedback/FeedbackStates.tsx`                                           | 🟢 Exists (minor polish)               |
| 13  | Input / Label / Select / Textarea              | `src/components/ui/Input.tsx`, `Label.tsx`                                             | 🔴 Needs Updates                       |
| 14  | FormField wrappers (RHF)                       | `src/components/forms/FormFields.tsx`                                                  | 🔴 Needs Updates                       |
| 15  | SearchInput                                    | `src/components/forms/SearchInput.tsx`                                                 | 🟡 Needs Creation                      |
| 16  | LineItemsEditor                                | `src/components/forms/LineItemsEditor.tsx`                                             | 🟡 Needs Creation                      |
| 17  | Sidebar                                        | `src/components/layout/Sidebar.tsx`                                                    | 🔴 Needs Updates (major)               |
| 18  | Header / Topbar                                | `src/components/layout/Header.tsx`                                                     | 🔴 Needs Updates (major)               |
| 19  | CompanySwitcher                                | `src/components/layout/CompanySwitcher.tsx`                                            | 🟡 Needs Creation                      |
| 20  | GlobalSearch                                   | `src/components/layout/GlobalSearch.tsx`                                               | 🟡 Needs Creation                      |
| 21  | AppLayout                                      | `src/components/layout/AppLayout.tsx`                                                  | 🔴 Needs Updates                       |
| 22  | Login page (split layout + BrandPanel)         | `src/features/auth/pages/LoginPage.tsx`, `src/features/auth/components/BrandPanel.tsx` | 🔴 Needs Updates (major) + 🟡 creation |
| 23  | StatCard + Sparkline                           | `src/components/ui/StatCard.tsx`, `Sparkline.tsx`                                      | 🟡 Needs Creation                      |
| 24  | StockAlertRow                                  | `src/features/dashboard/components/StockAlertRow.tsx`                                  | 🟡 Needs Creation                      |
| 25  | ActivityRow                                    | `src/features/dashboard/components/ActivityRow.tsx`                                    | 🟡 Needs Creation                      |
| 26  | POS suite (PosItemCard, CartPanel, QtyStepper) | `src/features/sales/components/*`                                                      | 🟡 Needs Creation                      |
| 27  | ThemeSwitcher / LanguageSwitcher               | `src/components/layout/ThemeSwitcher.tsx`, `LanguageSwitcher.tsx`                      | 🟢 Exists (token polish)               |
| 28  | Separator / Spinner / status-dot               | `src/components/ui/Separator.tsx`, `src/styles/index.css`                              | 🟢 Exists — compliant                  |

Legend: 🟢 compliant · 🟠 minor updates · 🔴 major updates · 🟡 does not exist

---

## 3. Detailed Component Specifications

---

### 1. Design Tokens + Theme Foundation — 🔴 Needs Updates

**Purpose:** Single source of truth for colors, fonts, radii, shadows, spacing.

**Design specs (mockup):** `--ink` teal scale (950→600), `--gold` accent scale, semantic
`success/danger/info` with `-bg` tints, radii 9/14/20/26px, 4 shadow levels, cubic-bezier(.19,1,.22,1) easing,
`--sbw: 264px` sidebar width.

**Light mode:** already implemented (`:root` in `tokens.css`).
**Dark mode:** already implemented via `.dark` remapping — keep.
**Responsive:** add the missing `1180px` tier to global grid rules.

**Gaps / actions:**

1. Add `@theme inline` mapping (§1.1) — without it no `primary`/`accent` utilities exist.
2. Add `--font-display: 'Fraunces', serif;` and put `IBM Plex Mono` first in `--font-mono`.
3. Load all three families in `index.html` (preconnect + one stylesheet link).
4. Map radii: mockup `r-sm 9px / r-md 14px / r-lg 20px` vs project `6/8/12px` — recommend updating
   `--radius-*` to `9px/14px/20px` to match the design language.
5. Add `--sidebar-width: 264px` (currently 256px) and a `--header-height: 66px` (mockup topbar).

**Status rationale:** tokens exist and are well-structured; only mapping/fonts/radii adjustments needed.

---

### 2. LogoMark — 🟡 Needs Creation

**Purpose:** Brand square used in login visual, sidebar, mobile brand row.

**Design specs:** 38×38px, `border-radius: 11px`, background `linear-gradient(150deg, gold-400, gold-600)`,
letter "S" in Fraunces 700 18px, color ink-950, shadow `0 4px 14px rgba(201,146,46,.4)`.

**Light/Dark:** identical in both themes (gold gradient on dark ink letter) — theme-independent.
**Responsive:** scales down to ~32px inside mobile brand row (`640px`).
**Path:** `src/components/ui/LogoMark.tsx` (props: `size?: 'sm' | 'md'`, `letter?: string`).
**Used by:** LoginPage (BrandPanel + mobile brand), Sidebar brand.

---

### 3. Avatar — 🟡 Needs Creation

**Purpose:** Initials avatar. Two design variants:

- **Gradient** (`.sb-avatar`): 33px circle, gold gradient, ink text — sidebar user card.
- **Solid** (`.avatar-sm`): 27px circle, `primary-800` bg, white text — table rows (clients, entreprises, users).

**Light/Dark:** solid variant uses `--color-primary-800` (light) / `--color-primary-700` (dark) via tokens.
**Responsive:** fixed sizes, no changes.
**Path:** `src/components/ui/Avatar.tsx` — props: `name`, `variant?: 'gradient' | 'solid'`, `size?: 'sm' | 'md'`.
Derive initials from first + last name (mockup `initials()` helper).

---

### 4. Button — 🔴 Needs Updates

**Purpose:** All CTAs and actions.

**Design specs (mockup variants):**

| Variant                                                 | Light                                                      | Behavior                                      |
| ------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| `primary`                                               | `ink-850` bg, white text, `sh-xs`                          | hover: `ink-800`, translateY(-1px), `sh-md`   |
| `gold` (main CTA — "Nouveau …", "Se connecter" context) | gradient 150° `gold-400→gold-600`, ink-950 text            | hover: brightness 1.06 + stronger gold shadow |
| `ghost`                                                 | transparent, 1.5px border, text-600                        | hover: border ink-700, surface-alt bg         |
| `danger-ghost`                                          | transparent, danger text, `danger-bg` border               | hover: danger-bg bg                           |
| sizes                                                   | default `12px 20px` / `sm` `8px 14px` / `block` full-width | loading spinner 15px                          |

**Dark mode:** `primary` → `--dark-surface-tertiary` bg / light text; `gold` unchanged (works on dark);
`ghost` borders → `--dark-border`; `danger-ghost` → dark danger tints (see `status-badge` dark hexes in
`index.css` as reference values).
**Responsive:** `sm` in table rows/toolbars; `block` in modals & login; touch targets ≥36px on mobile.
**Gaps:** current file has no `gold` variant, uses dead `bg-primary` classes + gray palette, no `block`.
**Path:** `src/components/ui/Button.tsx` — update variants to tokens + add `gold`, add `block` prop.

---

### 5. IconButton — 🟡 Needs Creation

**Purpose:** Compact icon-only actions. Two mockup forms:

- `.icon-btn` 31×31px, radius 9px, text-400 → hover surface-alt/ink-800; `danger` hover → danger tint (edit/delete row actions).
- `.tb-icon-btn` 37×37px circle — topbar (notifications).

**Light/Dark:** hover surfaces via `--color-surface-hover`; danger via danger tokens.
**Responsive:** ≥36px hit area on touch (scale up at ≤640px).
**Path:** `src/components/ui/IconButton.tsx` — props: `icon`, `variant?: 'default' | 'danger' | 'circle'`, `label` (aria).

---

### 6. Badge / StatusBadge — 🔴 Needs Updates

**Purpose:** Status pills in tables, KPIs, order detail.

**Design specs:** pill radius, `4.5px 11px` padding, 11.2px bold, optional 11px leading icon.
Variants: `gold` (accent-100/accent-700), `green` (success-bg/success), `red` (danger-bg/danger),
`ink` (rgba(primary-800,.09)/primary-700). Mockup order-status map:
`VALIDEE/RECUE→green·check`, `EN_COURS/EN_ATTENTE→gold·clock`, `ANNULEE→red·x`.

**Dark mode:** `index.css` already defines dark hex overrides for `status-badge--*` — reuse those values;
**missing:** `gold`/`warning` variant in `Badge.tsx` and a mapping helper.
**Responsive:** nowrap; truncation not needed (short labels).
**Path:** `src/components/ui/Badge.tsx` — add `gold` variant, optional `icon` prop, switch to tokens;
export `ORDER_STATUS_BADGE` map (feature-agnostic) or place map in `src/lib/`.

---

### 7. Card suite — 🔴 Needs Updates

**Purpose:** Content surfaces everywhere (dashboard panels, table wrapper, cart).

**Design specs:** `.card` = surface bg, 1px border, radius-lg (20px), 23px padding.
`.card-head` = flex between, h3 Fraunces 17px/650 + optional `.link` (12.5px, primary-700, arrow icon,
hover→gold-600). Composite sub-patterns used inside cards: chart-wrap (230px), activity list, alert list.

**Dark mode:** surface → `--dark-surface`, border → `--dark-border`; already token-driven once classes migrate.
**Responsive:** padding 23px → 16–18px at ≤640px; card-head wraps.
**Gaps:** current `Card.tsx` uses gray palette + `rounded-xl` (12px vs design 20px) and has no
`CardHead` with link slot; CSS `.card` classes in `index.css` conflict with component classes.
**Path:** `src/components/ui/Card.tsx` — update to tokens, add `CardHead` (`title`, `action?`), align radius.

---

### 8. PageHeader — 🟡 Needs Creation (styles exist, component doesn't)

**Purpose:** Every page heading: eyebrow + title + description on the left, actions on the right.

**Design specs:** eyebrow = IBM Plex Mono 11.5px, letter-spacing .13em, uppercase, **gold-600**;
h1 = Fraunces 31px/650, letter-spacing -.01em; description 13.6px text-600, max-width 520px;
actions = right-aligned (typically `Button variant="gold"`).

**Light:** as above. **Dark:** eyebrow → `--dark-accent`; title → `--dark-text-primary`.
**Responsive:** `flex-direction: column; align-items: flex-start` at ≤640px, h1 → 26px (mockup);
`index.css` `.page-header` rules (900/640) already cover stacking — keep.
**Path:** `src/components/layout/PageHeader.tsx` — props: `eyebrow`, `title`, `description?`, `actions?`.
Migrate `index.css` `.page-header__*` styles into the component (Tailwind classes) to avoid duplication.

---

### 9. Dialog / Modal — 🔴 Needs Updates

**Purpose:** Create/edit forms, order detail, new-order composer.

**Design specs:** root = fixed inset-0, centered, 20px padding; backdrop `rgba(10,30,32,.5)` + blur(3px);
box = white, radius-lg, max-width 480px (**`wide` = 700px** for order modals), max-height 86vh scroll;
sticky header (Fraunces 19px + 31px round close), body 22/24px, footer right-aligned with Cancel(ghost) + Confirm(primary).
Animations: scale(.94)+translateY(14px) → none, .3s ease-out expo.

**Dark mode:** box → `--dark-surface`; borders → `--dark-border`; backdrop unchanged.
**Responsive — key behavior:** at ≤640px the modal becomes a **bottom sheet**: full-width, `border-radius`
top corners only, fixed to bottom, translateY(100%) → 0, max-height 92vh, root `align-items: flex-end`.
**Gaps:** current `Dialog.tsx` lacks footer layout, `wide` size, and the entire bottom-sheet behavior.
**Path:** `src/components/ui/Dialog.tsx` — add `size?: 'md' | 'wide'`, `footer?: ReactNode`, mobile sheet
styles (`max-sm:` variants), keep Escape + scroll-lock (already implemented).

---

### 10. Toast — 🟠 Needs Updates (minor)

**Purpose:** Action feedback (create/update/delete/stock errors).

**Design specs:** bottom-right stack; toast = ink-950 bg, white 13.3px text, radius 12px, 21px icon circle
colored by type (success green / error red / info gold), slide-in from right, auto-dismiss ~2.9s, exit animation.

**Dark:** ink-950 surface is already dark — identical both themes (add lighter border in dark for separation).
**Responsive:** ≤420px full-width (left 14 / right 14), min-width removed.
**Current:** sonner is mounted `position="top-right" richColors` — wrong position and generic colors.
**Path:** `src/app/providers.tsx` — set `position="bottom-right"`, `toastOptions` classNames mapped to tokens
(or an unstyled custom toaster). Keep `ui.store.ts` notification queue as app-level wrapper around `toast()`.

---

### 11. Table suite — 🔴 Needs Updates

**Purpose:** All list screens (articles, clients, orders, movements, reports).

**Design specs:**

- Wrapper: `.table-wrap` card + `.table-scroll` (overflow-x, touch scrolling).
- Toolbar above: search input (280px) + optional filters/actions, wraps on small screens.
- `thead`: 11px uppercase, letter-spacing .07em, text-400, bold, surface-alt bg, bottom border.
- `tbody`: 13.6px cells, 14/18px padding, row dividers surface-alt, hover surface-alt;
  staggered fade-in per row (30ms delay); `.removing` exit animation (translateX + fade) before delete.
- `row-actions` cell: right-aligned edit + danger delete IconButtons.
- `.mono` for codes/prices/dates; `avatar-sm` + name composition for entity cells;
  badges in status/stock cells; empty-state inside wrapper when 0 rows.

**Dark:** headers bg `--dark-surface-secondary`, dividers `--dark-border`, hover `--dark-surface-hover`.
**Responsive:** `min-width: 640px` on table + horizontal scroll (design); toolbar wraps; on ≤640px consider
density reduction (padding 12px). Mockup keeps horizontal scroll — do the same.
**Path:** `src/components/ui/Table.tsx` — update tokens (currently gray palette); **add**:
`TableToolbar` (slot), `RowActions` (edit/delete callbacks), row entrance/exit animation classes,
`.data-table` global styles in `index.css` stay as the token-based base (already close to design —
needs uppercase/tracking on `th` and stagger animation).

---

### 12. EmptyState / LoadingState / Skeletons — 🟢 Exists (minor polish)

**Purpose:** Zero-data, loading and skeleton states (mockup `.empty-state`: 36px icon, title, hint text).

**Status:** `FeedbackStates.tsx` implements all + `TableSkeleton`/`CardSkeleton`; `index.css` has
`.empty-state`, `.spinner`, `.skeleton` with dark variants. **Compliant with design intent.**
**Minor:** swap gray classes → tokens; EmptyState icon color → text-400/50% per mockup.
**Path:** keep `src/components/feedback/FeedbackStates.tsx`.

---

### 13. Input / Label / Select / Textarea — 🔴 Needs Updates

**Purpose:** All forms (login, CRUD modals, order composer).

**Design specs:** field = label (12.5px/600, text-600, mb 7px) + control;
control = `12px 14px` padding, 1.5px border, radius-sm(9px), 14.5px text;
focus = border ink-700 + `0 0 0 4px rgba(23,58,62,.09)` ring;
**with leading icon** (`.field-input-wrap`): absolute 17px icon at left 13px, `padding-left: 38px` —
used on login identifier/password and search inputs.
`.field-row` = 2-col grid for compact modal forms → 1-col at ≤640px.

**Dark:** input bg `--dark-input`, border `--dark-border`, focus ring teal-tinted
(`rgba(79,133,132,.15)`), label `--dark-text-secondary`.
**Gaps:** no `icon` prop (login needs it), gray palette, ring style differs, radius.
**Path:** `src/components/ui/Input.tsx` (+ Select/Textarea same file) — add optional `leadingIcon`,
migrate to tokens, adopt mockup focus ring, radius-sm. `Label.tsx` — font-size 12.5px per design.

---

### 14. FormField wrappers (react-hook-form) — 🔴 Needs Updates

**Purpose:** Typed RHF bindings used by all feature forms.

**Specs:** same visuals as §13; zod errors → `error` prop styling (danger border + message 13px danger-600).
`SelectField`, `TextareaField`, `FormField` already exist.
**Dark/responsive:** inherit from §13.
**Path:** `src/components/forms/FormFields.tsx` — update classes after §13; add `leadingIcon` pass-through.

---

### 15. SearchInput — 🟡 Needs Creation

**Purpose:** Two mockup instances: **global search** (topbar pill) and **table search** (toolbar).

**Design specs:**

- Topbar: pill radius 22px, surface-alt bg, 37px left icon, `9px 14px 9px 37px`, focus → white bg + ink border + shadow-xs.
- Table: radius-sm, surface bg, 35px left icon, standard field styling.

**Dark:** bg `--dark-surface-secondary`, focus bg `--dark-input`, icon `--dark-text-muted`.
**Responsive:** topbar search becomes full-width ≤900px (mockup), placeholder shortens on mobile.
**Path:** `src/components/forms/SearchInput.tsx` — props: `variant?: 'pill' | 'field'`, `value`, `onChange`, `placeholder`.

---

### 16. LineItemsEditor — 🟡 Needs Creation

**Purpose:** Dynamic order lines in "Nouvelle commande" modals (client + supplier orders).

**Design specs:** each row = grid `2fr 84px 100px 32px` (article select, qty number, line total mono, delete icon-btn),
10px gaps, entrance animation; "Ajouter une ligne" ghost-text button with plus icon (hover→gold);
`line-total-bar`: dashed top border, label + Fraunces-mono 19px total, live recompute.
Behavior: min 1 line (toast error on deleting last), qty min 1.

**Dark:** inputs per §13; total bar border `--dark-border`.
**Responsive:** ≤640px grid → `1fr 60px 32px` and the line-total column is hidden (grand total remains).
**Path:** `src/components/forms/LineItemsEditor.tsx` — generic: `lines`, `onChange`, `columns` slot config so
customer-orders and supplier-orders features share it; money formatting via `src/lib/formatters.ts`.

---

### 17. Sidebar — 🔴 Needs Updates (major)

**Purpose:** Primary navigation; carries the app's strongest brand statement (dark ink panel).

**Design specs:**

- Fixed left, 264px, **ink-950 bg**, text `#CBDAD5`, full height, z-50.
- Brand row: LogoMark + "SGS" (Fraunces 650/18px, white) + mobile close button (hidden ≥900px).
- Nav: scrollable, 12px side padding; **group labels** (mono 10px, uppercase, `.13em`, `#4E6963`):
  Vue d'ensemble / Catalogue / Organisation / Tiers / Transactions — 12 items total (see mockup NAV).
- Item: 9.5/12px padding, radius 9px, 13.6px/500, icon 17px; hover white bg 5.5%; **active**:
  gold-tint bg `rgba(201,146,46,.16)`, white text, gold-400 icon, 3px gold left bar (`::before` at -12px).
- Footer: top border `rgba(255,255,255,.07)`; user card = Avatar(gradient) + name (13px white) + role
  (11px `#6F8983`) + logout IconButton.

**Light/Dark:** **dark ink in BOTH themes** (brand element). Do not use `dark:` variants here.
**Responsive:** ≥901px always visible. ≤900px: `translateX(-100%)`, opens via topbar hamburger, closes via
close-button / backdrop (`rgba(10,30,32,.45)`) / Escape; shadow-lg when open. Current implementation's
desktop collapse-to-72px is **not in the design** — remove or keep as an explicit extension (decision needed;
default: remove for parity).
**Gaps vs current `Sidebar.tsx`:** white bg, flat nav without groups, no user footer, emoji logo, wrong
active styling, mobile logic keyed off `window.innerWidth` at render (should be CSS/media or matchMedia hook).
**Path:** `src/components/layout/Sidebar.tsx` — rewrite styling; extract nav config to
`src/lib/navigation.ts` (with i18n labels + role restrictions per `src/lib/permissions.ts`);
state stays in `ui.store.ts` (`sidebarOpen`/`mobileMenuOpen`).

---

### 18. Header / Topbar — 🔴 Needs Updates (major)

**Purpose:** Global context bar.

**Design specs:** fixed top, left offset = sidebar width, 66px height, `bg rgba(246,247,248,.85)` +
blur(10px), bottom border; content: hamburger (≤900px) → **GlobalSearch** (pill, 340px max) → spacer →
**CompanySwitcher** → notifications IconButton (red dot badge 8px, 2px surface ring).
User identity lives in the **sidebar footer** per design (topbar has no user menu).

**Light:** as above. **Dark:** bg `rgba(16,32,35,.85)` (dark-surface + alpha), border `--dark-border`,
search per §15.
**Responsive:** ≤900px left:0 + padding 16px + hamburger appears; search expands; ≤640px company label
hides (dot + chevron remain).
**Gaps vs current `Header.tsx`:** no search, no company switcher, user dropdown in topbar (move to sidebar),
gray palette. ThemeSwitcher/LanguageSwitcher are project additions **not in the mockup — keep them**.
**Path:** `src/components/layout/Header.tsx` — restructure per above; keep `aria-expanded`/`aria-haspopup`.

---

### 19. CompanySwitcher — 🟡 Needs Creation

**Purpose:** Multi-tenant context selector (core business requirement — switches ALL data scoping).

**Design specs:** pill button (radius 22px, 1.5px border, surface bg): green status dot (7px + 2.5px halo),
company name 13px/600, chevron (rotates 180° when open); dropdown = 240px panel, radius 12px, shadow-lg,
6px padding, rows with name + check icon; active row = gold-100 bg + bold ink-800.
Behavior: click-outside closes (document listener), Escape closes, selection fires toast + data refetch.

**Light:** as above. **Dark:** panel `--dark-surface`, hover `--dark-surface-hover`, active bg
`rgba(201,146,46,.18)` + accent text, border `--dark-border`.
**Responsive:** ≤640px label hidden (compact dot-only trigger).
**Path:** `src/components/layout/CompanySwitcher.tsx`; company state → new slice in `auth.store.ts` or a
`tenant.store.ts`; selection must invalidate TanStack Query caches
(`queryClient.invalidateQueries()` on switch).

---

### 20. GlobalSearch — 🟡 Needs Creation

**Purpose:** Topbar search affordance (mockup: input only; app should route/act on submit).

**Design specs:** see §15 pill variant.
**Path:** `src/components/layout/GlobalSearch.tsx` — v1: debounced input navigating to a `/search?q=` results
page or filtering current list; keep visual identical to mockup.

---

### 21. AppLayout — 🔴 Needs Updates

**Purpose:** Shell composition (Sidebar + Header + main outlet + backdrop).

**Design specs:** main = `margin-left: 264px`, padding `98px 32px 56px` (clears 66px fixed header);
`.view` entrance animation (fade + 12px rise, .4s); backdrop div for mobile sidebar.
**Dark:** page bg → `--dark-background`.
**Responsive:** ≤900px margin-left:0, padding `90px 18px 48px`.
**Gaps:** uses `lg:pl-72` (288px ≠ 264px), no `xl` breakpoint parity, gray bg classes, missing 1180 grid tier.
**Path:** `src/components/layout/AppLayout.tsx` — wire to `--sidebar-width`/`--header-height` tokens.

---

### 22. Login page — 🔴 Needs Updates (major) + BrandPanel 🟡 creation

**Purpose:** Entry screen; the mockup's marketing moment.

**Design specs:**

- **Left visual panel** (`.login-visual`, hidden ≤640px): radial teal gradient (#1B4B4F→ink-900→ink-950),
  2 blurred floating orbs (teal 360px / gold 280px, 12s alternate float), 7%-opacity grid overlay (46px cells),
  top brand row, mono gold eyebrow with live-dot, Fraunces 46px headline, 15.5px paragraph,
  **3 glass float-cards** (rgba white .08 + blur16 + white/14 border; icon chips green/gold/blue;
  float animation 6s, staggered), bottom stat trio (mono 24px white + 12px labels).
- **Right form panel** (surface bg): 378px card, Fraunces 29px "Connexion", sub 14px text-600,
  identifier + password fields **with leading icons**, primary block button with spinner state,
  hint line 12px text-400.
- Mobile (≤640px): single column, visual hidden, `mobile-brand` row (LogoMark + SGS) above the form.

**Dark:** visual panel identical (already dark); form side → `--dark-surface`, inputs per §13, headline
`--dark-text-primary`.
**Responsive:** per mockup §1.6; ensure orbs don't overflow (`overflow:hidden` already).
**Gaps:** current `LoginPage` is a plain centered Card — completely different composition (also uses
CardHeader/Footer, register/forgot links not in mockup — keep links only if product requires).
**Path:** `src/features/auth/components/BrandPanel.tsx` (new: orbs, grid, float cards, stats — data via props)

- rewrite `LoginPage.tsx` split layout; keep RHF+zod+i18n wiring and `useLogin`.

---

### 23. StatCard + Sparkline — 🟡 Needs Creation

**Purpose:** Dashboard KPI tiles (4 units: stock, weekly sales, active clients, below-threshold articles).

**Design specs:** grid 4-col (18px gap); card = surface, border, radius-lg, 21px padding, overflow hidden;
top row = 40×40 icon chip (per-KPI tint: gold/success/info/danger bg+fg) + trend pill (11.5px bold,
up=success-bg/green, down=danger-bg/red, 11px arrow icon); value = mono 28px/600 tracking -.02em with
**count-up animation** (16ms ticks); label 12.6px text-600; **sparkline** SVG 90×32 bottom-right,
2px stroke, 55% opacity, per-KPI color; staggered card entrance (20→80→140→200ms); hover lift −2px + shadow-md.

**Dark:** card per §7; chip tints → dark token tints (e.g. `rgba(201,146,46,.18)`); sparkline colors: gold
`#D9A94A`, success `#4CCB75`, info `#70B5E5`, danger `#F07171`.
**Responsive:** 4-col → 2-col ≤1180px → 1-col ≤640px.
**Path:** `src/components/ui/StatCard.tsx` + `src/components/ui/Sparkline.tsx`
(props: `value`, `label`, `icon`, `trend {direction, value}`, `sparkData[]`, `tone`);
charts themselves stay **recharts** (already a dependency) — do not adopt Chart.js.

---

### 24. StockAlertRow — 🟡 Needs Creation (dashboard feature)

**Purpose:** "Alertes stock bas" list rows.

**Design specs:** row = danger-bg bg, radius 11px, 11/13px padding, 12px gap, hover translateX(2px);
danger triangle icon; name 13px bold + **progress bar** (4px, track `rgba(221,75,62,.18)`, fill danger,
width = stock/seuil %); right mono value `stock/seuil` in danger bold.
**Dark:** bg `rgba(220,75,75,.12)`, fill `--color-danger-500`, text `#F07171`.
**Responsive:** stacks naturally (flex); value wraps under 360px if needed.
**Path:** `src/features/dashboard/components/StockAlertRow.tsx` (reusable enough to promote to `ui/` later).

---

### 25. ActivityRow — 🟡 Needs Creation (dashboard feature)

**Purpose:** "Activité récente" stock-movement feed.

**Design specs:** 32×32 icon chip (ENTREE → success-bg/arrow-down/green; SORTIE → gold-100/arrow-up/gold),
title 13.2px/600, meta 11.8px text-400 (`qty unités · origine · date`), row dividers surface-alt.
**Dark:** chip tints via token alphas; text `--dark-text-secondary`/`--dark-text-muted`.
**Responsive:** full-width rows; long article names truncate with ellipsis.
**Path:** `src/features/dashboard/components/ActivityRow.tsx`.

---

### 26. POS suite (sales feature) — 🟡 Needs Creation

**Purpose:** "Point de vente" screen: article picker grid + cart panel.

**Design specs:**

- `pos-layout`: `1fr 340px`, 20px gap.
- `pos-grid`: auto-fill minmax(155px,1fr), 14px gap. Item: surface card, 1.5px border, radius-md(14px),
  15px padding, hover → gold border + shadow-md + lift −3px; 38×38 letter chip (gold-100 bg, Fraunces),
  name 13.3px, category · stock 11px text-400, mono price 13.3px ink-800; **out-of-stock → 40% opacity,
  pointer-events none**; staggered entrance.
- `cart-panel`: sticky top 98px (unsticks ≤900px), surface card, max-height `calc(100vh-132px)` column;
  "Panier" Fraunces 17px; rows (name ellipsis + unit price mono 11.2px) with **qty stepper**
  (23×23 buttons surface-alt → hover gold-100/gold-600, mono qty); empty state (cart icon + hint);
  totals block: HT / TVA / **grand total 18px mono bold**; primary block "Encaisser".

**Dark:** cards per tokens; stepper hover `rgba(201,146,46,.2)`; disabled item 40% as-is.
**Responsive:** ≤900px single column, cart becomes normal block (not sticky) **above the grid or below —
mockup puts it after the grid**; keep checkout reachable (consider sticky bottom bar on mobile as enhancement).
**Path:** `src/features/sales/components/PosItemCard.tsx`, `CartPanel.tsx`, `QuantityStepper.tsx`;
cart state → `sales` zustand slice or local state + hooks in `src/features/sales/hooks/`.

---

### 27. ThemeSwitcher / LanguageSwitcher — 🟢 Exists (token polish)

**Purpose:** Project-specific additions (not in mockup) — keep.
**Action:** migrate dropdown surfaces from gray to tokens so they match the new dark palette.
**Path:** unchanged.

### 28. Separator / status-dot / spinner CSS — 🟢 Exists — compliant

`.divider`, `.status-dot--*`, `.spinner`, `.numeric` in `index.css` already token-based with dark variants.
No change.

---

## 4. Flagged Views (pages composed from the above)

All feature pages exist as stubs and will be rebuilt from these globals (out of scope for this audit,
listed for traceability):

| Page                                                                                | Composed from                                                    | Path                                              |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| Tableau de bord                                                                     | PageHeader, StatCard, Card+charts, ActivityRow, StockAlertRow    | `src/features/dashboard/pages/DashboardPage.tsx`  |
| Rapports & stock                                                                    | Card, Table suite, badges                                        | `src/features/stock/pages/StockPage.tsx`          |
| CRUD lists (catégories, articles, entreprises, clients, fournisseurs, utilisateurs) | PageHeader, SearchInput, Table suite, Dialog + FormFields, toast | respective `src/features/*/pages/`                |
| Commandes client/fournisseur                                                        | Table suite, Detail Dialog (wide), LineItemsEditor               | `src/features/{customer,supplier}-orders/pages/`  |
| Mouvements                                                                          | Table suite, badges                                              | `src/features/stock/pages/StockMovementsPage.tsx` |
| Point de vente                                                                      | POS suite                                                        | `src/features/sales/pages/SalesPage.tsx`          |
| Connexion                                                                           | BrandPanel + fields + Button                                     | `src/features/auth/pages/LoginPage.tsx`           |

---

## 5. Recommended Execution Order

1. **Foundation (blockers):** `@theme` mapping, fonts in `index.html`, radius tokens, `1180px` tier → then a
   mechanical `gray-*` → token migration pass on all `ui/` components.
2. **Atoms:** LogoMark, Avatar, Button(+gold), IconButton, Badge(+gold), Input(+icon), SearchInput.
3. **Composites:** Card/CardHead, PageHeader, Dialog(+bottom sheet, wide, footer), Table suite, toast config.
4. **Shell:** Sidebar rewrite, CompanySwitcher, GlobalSearch, Header restructure, AppLayout offsets.
5. **Screens:** Login split layout → Dashboard (StatCard/Sparkline/Alert/Activity) → CRUD pages →
   Orders + LineItemsEditor → POS.
6. **Dark-mode QA pass** on every component (the mockup only proves light mode) + responsive sweep at
   1280 / 1024 / 768 / 375 / 320 widths.

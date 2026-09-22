# SGS Frontend — Development Roadmap

**Date:** 2026-09-16 · **Scope:** current codebase → final delivery
**Verdict:** the codebase now contains a working feature-based frontend wired to the French Swagger contract. The catalogue, customers, suppliers, companies, users, customer orders and supplier orders have real list/detail/form flows; the shared table, pagination, design-system, dark-mode and responsive infrastructure is in active use. The historical plan below is retained for traceability, while the implementation update immediately after this summary is the current source of truth.

---

## 0. Current State Summary

| Layer                                                                             | State               | Notes                                                                                                                  |
| --------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Build/tooling (Vite 8, TS 7, Tailwind v4 `@theme`)                                | ✅ Solid            | typecheck + build green; env files exist (`.env`, `.env.example`, typed via `vite-env.d.ts`)                           |
| Design system (`styles/`, `components/ui` — 14 primitives)                        | ✅ Solid            | brand tokens, light/dark, motion keyframes, gold/ink palette; matches mockup                                           |
| App shell (Sidebar, Header, AppLayout, GlobalSearch + dropdown, view transitions) | ✅ Solid            | grouped nav, role-filtered, responsive drawer                                                                          |
| Auth (Login split layout, stores, interceptors + refresh)                         | 🟠 Partial          | login wired; **no `/auth/me` bootstrap, no register page, no token-in-zustand sync**                                   |
| Dashboard                                                                         | ✅ Near-final       | KPIs, charts, tables, alerts, skeletons; `/dashboard/charts` unpinned in swagger                                       |
| CRUD/list pages                                                                   | ✅ Implemented      | Articles, categories, companies, customers, suppliers, users and order lists use shared tables/forms/pagination        |
| Feature types & schemas                                                           | ✅ Contract-aligned | Feature DTO/domain types and mappers are aligned to `swagger.json`; optional fields are normalized at the API boundary |
| API layer per feature                                                             | ✅ Wired            | French Swagger paths, lifecycle operations, typed mappers and no undocumented list params/envelopes                    |
| i18n                                                                              | ✅ Maintained       | Touched customer, supplier and order flows include French/English translations; parity audit is available              |
| Feedback (toasts, skeletons, states)                                              | 🟠 Partial          | FeedbackStates exist; **sonner `Toaster` not yet brand-aligned (audit #10); no `toast.*` calls anywhere**              |
| Testing                                                                           | ✅ Active           | Unit/component suite reports 111 passing tests; 19 live audit cases are opt-in; Playwright smoke specs are present     |
| Lint/CI                                                                           | ✅ Configured       | Oxlint, typecheck, CI workflow and pre-commit hooks are configured; generated test artifacts are ignored               |

---

## Implementation update — completed work

### Contract and data layer

- [x] Reconciled feature API paths with `swagger.json`; list APIs for articles, categories and companies no longer invent query parameters or response envelopes.
- [x] Removed obsolete `RequestParams`, `PaginatedResponse`, `ApiResponse` and stale constants that were not part of the Swagger contract.
- [x] Added DTO/domain mappers so frontend naming remains consistent without sending arbitrary backend fields.
- [x] Verified VAT live against the API: domain `vatRate` is decimal (`0.2`), wire `tauxTva` is percentage (`20`).
- [x] Fixed article edit submission when the API returns an empty optional `photo` value.

### Catalogue, stock and CRUD

- [x] Implemented real articles, categories, companies, customers, suppliers and users pages with translated CRUD forms, loading/empty/error states and API mutations.
- [x] Article stock badges now derive from current stock and minimum threshold; status filtering is performed client-side because the Swagger list endpoint exposes no status query parameter.
- [x] Documented that `seuilMin` is an alert threshold and does not create initial stock; stock enters through `/api/mouvements-stock`.
- [x] Customer and supplier forms are single-column, responsive and dark-mode compatible. Address/photo/postal-code fields were removed from the visible customer form; city is manually entered.
- [x] Phone fields use one composite control with country/dial-code selection and number entry, shared across applicable forms.

### UI and design system

- [x] Applied the design-system gold gradient, dark text, shadow, hover and focus treatment to primary creation actions, including article, category, customer, supplier, point-of-sale, user and company actions.
- [x] Standardized delete icon hover states to the danger red palette and made destructive confirmation buttons visible with danger colors.
- [x] Applied the SGS token palette to light/dark states and preserved responsive behavior for forms, dialogs, tables and action toolbars.
- [x] Silenced `no-underscore-dangle` only for the existing session-probe file in oxlint; the rule remains active elsewhere.

### Tables and orders

- [x] Added centered shared pagination with page-size controls and responsive layout.
- [x] Fixed pagination rendering to use the active paginated row model; records no longer leak onto page one when a second page exists.
- [x] Implemented customer and supplier order creation with exact Swagger payloads, translated status filters and responsive/dark-mode forms.
- [x] Implemented order detail pages and lifecycle actions: customer validate/ship/deliver/cancel; supplier receive/partial receive/cancel.
- [x] Added keyboard-accessible row-click navigation from both order tables to their detail pages.

### Verification

- [x] TypeScript typecheck passes.
- [x] Unit/component suite currently reports 111 passing tests; live audit has 19 opt-in cases and runs only with `LIVE=1` or `npm run test:live`.

---

## Phase 0 — Contract & Foundations (blocks everything)

**Goal:** make the API layer truth-ful before wiring any page to it.

**P0.1 — Reconcile endpoints with swagger.json (CRITICAL)**
Swagger pins French paths: `/api/clients`, `/api/fournisseurs`, `/api/entreprises`, `/api/commandes-client`, `/api/commandes-fournisseur`, `/api/ventes`, `/api/mouvements-stock`, `/api/stock/etat|alertes|valorisation`, `/api/utilisateurs`. Frontend features call `/customers`, `/suppliers`, `/supplier-orders`, `/sales`, `/stock/movements`…

- Fix `src/lib/constants.ts::API_ENDPOINTS` to the swagger paths (baseURL already includes `/api`).
- Update every `features/*/api/index.ts` to use `API_ENDPOINTS.*` instead of local string constants.
- Also map the missing operations: order lifecycle `…/{id}/valider` / `…/{id}/annuler` / `…/{id}/receptionner`, stock valorisation.
- **Deliverable:** one endpoint table in constants.ts; all features import from it.

**P0.2 — Pin the real DTO types**

- Move entity shapes from `types/common.types.ts` into each `features/*/types` (Article → articles, Customer → customers, …), keeping `common.types.ts` for cross-feature types (UserRef, Address, enums).
- Cross-check field names against `swagger.json` schemas (e.g. `ArticleDTO`, `ClientDTO`). Where backend uses French names (`DashboardKpisDTO.chiffreAffairesDuMois`), **map DTO → domain model in the feature API layer** (1 mapper per endpoint) so components never see raw DTOs. Replace the `any` casts in `StockApi.getMovements/getAlerts` with real movement/alert types.
- Type `/dashboard/charts` contract once the backend confirms it (currently typed `DashboardCharts` by frontend convention — keep, but verify against server).

**P0.3 — Response envelope alignment**
Verify whether endpoints return `Page<T>` (Spring) directly or wrapped; align `PaginatedResponse` and the hooks' `.data` unwrapping conventions (auth hooks unwrap; entity hooks return Axios responses — standardize on unwrap + react-query `select`).

**P0.4 — Auth bootstrap**

- Add `/auth/me` fetch on app mount (restores session from refresh token); ProtectedRoute waits for it.
- Sync tokens: either trust zustand persist (single source) or localStorage-only — remove the current dual-write (`auth.store` writes localStorage keys read by axios interceptors).
- Decide register flow: swagger has `/api/auth/register` — either build a RegisterPage or remove the link from LoginPage.

**Exit criteria:** `typecheck` + `build` green; a manually-fired request from any feature reaches a real backend endpoint path.

---

## Phase 1 — Shared Data-Table & Form Infrastructure (build once, reuse 10×)

**Goal:** every list page and form dialog uses the same machinery.

**P1.1 — DataTable component** (`src/components/data-table/` — folder doesn't exist yet)

- Built on `@tanstack/react-table` (v9 already installed): generic `DataTable<T>`, column defs, sorting, `DataTablePagination` (wired to `usePagination`), `DataTableToolbar` (search + filters + column visibility), loading skeleton rows, `EmptyState` integration.
- Column primitives: `DataCard`? No — keep: sortable header, mono numeric cell, date cell, badge/status cell, row actions menu.
- A11y: keyboard sortable headers, `aria-sort`.

**P1.2 — Form infrastructure**

- Extend `components/forms/FormFields.tsx`: `Select` (native, styled), `Textarea`, `Checkbox`, `CurrencyInput`, `DateField` — all RHF-compatible (`register`/`Controller`).
- `FormDialog` pattern: Dialog + RHF form + zodResolver + `useMutation` with pending state on submit button + sonner toast on success/error. One reusable `EntityFormDialog` per feature reusing the schema.
- `ConfirmDialog` for deletes (danger intent, typed entity name).

**P1.3 — Toast layer**

- Brand-align sonner Toaster (audit #10: position bottom-right per mockup, brand tokens via `toastOptions.classNames`), and create `src/lib/toast.ts` with `toastSuccess/toastError/toastPromise` helpers so mutations call one helper instead of raw sonner.

**P1.4 — Error handling**

- Wire `lib/error-handler.ts` into react-query `QueryCache`/`MutationCache` onError (global toast), except for forms that surface field errors inline (skip via mutation meta flag).
- Backend field errors → RHF `setError` mapping via `extractFieldErrors`.

**Exit criteria:** demo-able fake entity (e.g. Categories) with full CRUD using only shared infra.

---

## Phase 2 — Pilot Feature: Categories (vertical slice)

The cheapest full loop to prove the pattern end-to-end: list → create/edit dialog → delete confirm → search → pagination → i18n → role gating.

- `CategoriesPage`: DataTable (name, description, articleCount badge, isActive toggle, actions), toolbar search, pagination; skeleton + empty states.
- `CategoryFormDialog` + `CategoriesSchema` (real zod: name required/max, description max, parentId optional).
- Wire `useCategories/useCreateCategory/useUpdateCategory/useDeleteCategory` with toast + invalidation; RoleRoute/`hasPermission` gating (GESTIONNAIRE+).
- **Deliverable:** documented reference implementation ("the Categories pattern") other features copy.

---

## Phase 3 — Catalog & Reference Data

**P3.1 — Articles** (`/catalog/articles`)

- List: DataTable with columns name, code (mono), category, unit price (currency), stock level w/ `formatStockStatus` badge, status; search + category filter; pagination.
- Details page (`/catalog/articles/:id`): identity card + stock state + movements history + edit dialog.
- `ArticleFormDialog`: fields per swagger `ArticleDTO` (name, code, category select — fetched, unit, unitPrice currency, minStock threshold, isActive).
- Translations: expand `articles` ns fr/en.

**P3.2 — Companies** (`/companies`, ADMIN)

- Same pattern; SIRET/VAT fields, address sub-form; logo upload deferred (P8).

**P3.3 — Users** (`/users`, ADMIN)

- List + role badges + active toggle; `UserFormDialog` (firstName, lastName, email, role select, companyId select, password on create only); deactivation instead of hard delete.
- Profile/self-service stays in P6.

**P3.4 — Suppliers** (`/suppliers`)

- List + details; form (company name, contact, email, phone, address).

**Exit criteria:** all reference data CRUD complete with role-gated actions.

---

## Phase 4 — Tiers: Customers & Orders

**P4.1 — Customers** (`/customers`)

- List + details (identity, contact, order history slice, total spent); form dialog.

**P4.2 — Customer orders** (`/customer-orders`)

- List with status badges (`formatOrderStatus`), date range filter, client filter.
- **Details page is the core flow:** header (number, client, date, status), line-items table (article select w/ live price, qty, unit, line total), totals footer (subtotal/TVA/total), **lifecycle actions → `valider` / `annuler` endpoints** with confirm dialogs and status transitions.
- Order status badge component shared with supplier orders.

**P4.3 — Supplier orders** (`/supplier-orders`)

- Same pattern + **`receptionner` action** which posts a receipt that generates stock entry — after success, toast "Réception créée — stock mis à jour" and invalidate stock queries.

**Exit criteria:** full order lifecycle operable from the UI.

---

## Phase 5 — Stock & Sales (read-mostly + POS)

**P5.1 — Stock overview** (`/stock`, read-only per swagger tag)

- Table: article, category, current qty, min threshold, status badge, unit value; `valorisation` endpoint powers a totals row + export button (CSV client-side).
- Filters: category, status (rupture/faible/ok).

**P5.2 — Movements** (`/stock/movements`)

- Read-only DataTable: date, article, type (ENTREE/SORTIE/AJUSTEMENT), qty ±, reference order/sale, user; filters by type/date/article.

**P5.3 — Alerts** (`/stock/alerts`)

- List with severity bars (reuse the dashboard panel row spec), acknowledge/resolve if backend supports.

**P5.4 — Sales / POS** (`/sales`)

- **Highest-complexity UI**: sale creation is a cart-style flow (article search picker, qty, live stock check, cart lines, totals, payment) → `POST /api/ventes` decrements stock server-side.
- List of sales with details drawer (lines, totals, client optional).
- VENDEUR role gets this as primary screen (nav label "Point de vente"); ensure role gating shows only permitted modules in sidebar (already supported by `NAV_GROUPS.roles`).

**Exit criteria:** sellable flow from POS to stock decrement, visible in movements.

---

## Phase 6 — Auth Completeness, Profile, Notifications

**P6.1 — Profile page**: real data from `useAuthStore().user`, edit form (`updateProfile`), change-password form (two zod schemas), avatar upload or initials (Avatar exists).
**P6.2 — Settings page**: theme (already), language (already), density/notification preferences → persist to localStorage via ui.store.
**P6.3 — Notifications**: list page (DataTable, read/unread, mark-as-read `PUT`), **Header bell wired to real unread count** (replace the hardcoded red dot) + polling with refetch interval or socket later; dropdown of last N in Header.
**P6.4 — Register page** (if P0.4 decides to keep it) or remove route/link.

---

## Phase 7 — Hardening & Quality Gates

**P7.1 — Testing (active suite)**

- Keep the existing Vitest/jsdom setup and expand coverage as new features land.
- Unit/component coverage already includes formatters, permissions, mappers, i18n parity and DataTable pagination/row behavior.
- Keep Playwright smoke coverage for i18n and the main application shell; add authenticated flows when test credentials are available.
- Keep `npm run test:live` opt-in so local API audits never run accidentally in CI.

**P7.2 — Lint & format as a gate**

- Run `npm run lint`, fix fallout; add `typecheck`+`lint`+`test` to a CI workflow (GitHub Actions), prettier check.
- husky + lint-staged (dep already present) for staged-file lint.

**P7.3 — A11y & responsive pass**

- Focus traps in Dialog (check implementation), keyboard nav on all menus/comboboxes, aria labels, `prefers-reduced-motion` verified.
- 360px → 1920px sweep of every page (tables scroll, dialogs sheet-ify on mobile).

**P7.4 — Performance**

- Recharts already route-lazy; consider `manualChunks` for recharts if needed.
- React Query staleTimes, virtualization only if tables >200 rows prove slow.
- Route-level prefetch on nav hover (optional).

---

## Phase 8 — Delivery Polish

- Error/404 pages (currently `*` → redirect dashboard; add NotFound), route-level error boundaries.
- README rewrite (setup, scripts, env, architecture link), .env.example review.
- Mockup-vs-implementation visual QA pass against `SGS_maquette_demo (1).html` (spacing, tokens, dark mode parity) — the component-audit.md table is the checklist.
- i18n completeness audit: every visible string keyed (several pages still hardcode French strings); en translations for all feature ns.
- Build budget check, favicon/meta, preview deploy smoke.

---

## Module Status Matrix (detail)

| #   | Module             | Pages                                                   | API                                                           | Types                 | Schema            | i18n    | Status                                  |
| --- | ------------------ | ------------------------------------------------------- | ------------------------------------------------------------- | --------------------- | ----------------- | ------- | --------------------------------------- |
| 1   | auth               | Login ✅ split-layout wired; Profile/Settings 🟠 static | ✅ endpoints (paths ⚠️)                                       | 🟠 User ok, Auth stub | ✅ login/register | ✅      | **P0.4 + P6**                           |
| 2   | dashboard          | ✅ Complete                                             | ✅ kpis ⚠️charts unpinned                                     | ✅ typed              | ✅                | ✅      | **Done (verify charts)**                |
| 3   | categories         | ✅ list/form/delete                                     | ✅ Swagger paths                                              | ✅ typed/mapped       | ✅                | ✅      | **Done**                                |
| 4   | articles           | ✅ list/details/form/status filter                      | ✅ Swagger paths + mappers                                    | ✅ typed/mapped       | ✅                | ✅      | **Done**                                |
| 5   | customers          | ✅ list/details/form                                    | ✅ `/api/clients`                                             | ✅ typed/mapped       | ✅                | ✅      | **Done**                                |
| 6   | suppliers          | ✅ list/details/form                                    | ✅ `/api/fournisseurs`                                        | ✅ typed/mapped       | ✅                | ✅      | **Done**                                |
| 7   | customer-orders    | ✅ list/create/detail/lifecycle                         | ✅ create/detail/validate/ship/deliver/cancel                 | ✅ typed/mapped       | ✅                | ✅      | **Done**                                |
| 8   | supplier-orders    | ✅ list/create/detail/lifecycle                         | ✅ create/detail/receive/partial-receive/cancel               | ✅ typed/mapped       | ✅                | ✅      | **Done**                                |
| 9   | sales              | 🔴                                                      | 🟠 wrong path (`/ventes`)                                     | 🔴                    | 🔴                | 🟠      | **P5.4**                                |
| 10  | stock              | 🔴 3 pages                                              | 🟠 wrong paths (`/stock/etat`,`/alertes`,`/mouvements-stock`) | 🔴 + `any` casts      | 🔴                | 🟠      | **P5.1–3**                              |
| 11  | companies          | ✅ list/details/form                                    | ✅ `/api/entreprises`                                         | ✅ typed/mapped       | ✅                | ✅      | **Done**                                |
| 12  | users              | ✅ list/form/delete                                     | ✅ `/api/utilisateurs`                                        | ✅ typed/mapped       | ✅                | ✅      | **Done**                                |
| 13  | notifications      | 🔴                                                      | 🟠 path ok but unread-count API?                              | 🔴                    | 🔴                | 🟠      | **P6.3**                                |
| 14  | search             | ✅ working                                              | ✅ fan-out                                                    | ✅                    | n/a               | partial | **Re-sync after P0 (endpoint renames)** |
| 15  | ui/layout/feedback | ✅                                                      | —                                                             | —                     | —                 | —       | **Done (toaster brand pass P1.3)**      |

## Suggested Execution Order

```
P0 (contract)  →  P1 (table+form infra)  →  P2 (Categories pilot)
      →  P3 (Catalog: articles → companies → users → suppliers)
      →  P4 (Customers → CO → SO)  →  P5 (Stock pages → Sales POS)
      →  P6 (Auth/profile/notifs)  →  P7 (tests/CI/a11y)  →  P8 (polish)
```

Each phase ends with: typecheck green, lint clean, feature demoed against the running Spring Boot API, translations updated for touched modules.

# SGS — Système de Gestion de Stock (Frontend)

Production-shaped React SPA for the SGS inventory-management platform: catalog, orders lifecycle (customers & suppliers), POS sales, stock monitoring, and admin modules — against a French-named Spring Boot REST API.

**Stack:** React 19 · TypeScript 7 · Vite 8 · Tailwind v4 (`@theme` tokens) · TanStack Query + Table v9 · react-hook-form + zod · zustand · i18next (fr/en) · sonner · vitest + Testing Library · oxlint

---

## Getting started

```bash
# 1. Install
npm install

# 2. Configure the API URL
cp .env.example .env        # VITE_API_URL=/api → dev-proxied to :8081 (no CORS)

# 3. Run
npm run dev                 # http://localhost:5173 (proxies /api → :8081)
```

### Scripts

| Command                   | What it does                                         |
| ------------------------- | ---------------------------------------------------- |
| `npm run dev`             | Vite dev server with HMR + `/api` proxy              |
| `npm run build`           | `tsc && vite build` (typecheck is part of the build) |
| `npm run preview`         | Serve the production build locally                   |
| `npm run typecheck`       | `tsc --noEmit`                                       |
| `npm run lint`            | oxlint over `src/` (TS-native, ~60 ms)               |
| `npm test`                | vitest in run mode                                   |
| `npm run test:live`       | opt-in live audit against the running API            |
| `npm run audit:endpoints` | compare frontend endpoint usage with `swagger.json`  |
| `npm run audit:i18n`      | verify feature translation parity                    |
| `npx vitest --ui`         | Vitest UI (watch mode with browser panel)            |

### Quality gates

CI (`.github/workflows/ci.yml`) runs **typecheck → lint → test** on every push/PR.
Locally, a husky pre-commit hook runs **lint-staged** (oxlint + prettier on staged files).

> **Why oxlint and not typescript-eslint?** This project runs **TypeScript 7** (the native compiler), which removed the JS API typescript-eslint depends on (it hard-throws; support is tracked at typescript-eslint#10940). Oxlint parses TS/TSX natively without any TypeScript-API dependency and honors the existing `eslint-disable` comments.

---

## Current implemented scope

The application is currently wired to the French-named Swagger contract in `swagger.json` and is no longer a placeholder CRUD shell.

### Design system and shell

- SGS teal/gold design tokens are exposed through Tailwind v4 `@theme`, with light and dark mappings.
- Primary creation CTAs use the `gold` button variant and its hover state.
- Delete icons use a neutral state and turn red on hover; destructive confirmation buttons use the danger palette.
- The fixed header/search layout is responsive; the global search is visible after the sidebar offset and uses the design width.
- Sidebar, header, language/theme controls, dialogs, cards, badges, tables and forms use token-based surfaces, borders and dark-mode colors.
- Form dialogs support a configurable submit-button variant, responsive layouts and visible validation errors.

### Data tables

- `DataTable` provides sorting, filtering, client-side pagination, loading/empty states and responsive horizontal scrolling.
- Pagination is centered consistently across all tables, with page size controls and accessible previous/next buttons.
- Pagination renders the active paginated row model, so a sixth record with a page size of five appears only on page two.
- Tables can opt into keyboard-accessible row navigation through `onRowClick`; customer and supplier order rows open their detail pages.

### Catalog and stock

- Articles use Swagger DTO mappers and preserve the backend VAT convention: the domain stores a decimal fraction while the wire sends `tauxTva` as a percentage.
- Article editing normalizes empty backend photo strings so the hidden optional field cannot block form submission.
- Article stock status is derived from `stockActuel` and `seuilMin`: `Rupture` when stock is zero, `Stock faible` when stock is positive but at or below the threshold, otherwise `En stock`.
- The article list has category and status filters. Swagger exposes no article status query parameter, so this filter is intentionally computed client-side from the response fields.
- `seuilMin` is an alert threshold, not an initial quantity. The article create DTO has no `stockActuel`; stock is added through `POST /api/mouvements-stock`.

### Customers and suppliers

- Customer and supplier CRUD uses the real `/api/clients` and `/api/fournisseurs` endpoints.
- Customer and supplier forms are single-column, responsive and dark-mode compatible.
- The customer form exposes name, first name, manually entered city, email and a unified phone control; address, postal code and photo inputs are not shown.
- The supplier form follows the same layout and exposes name, manually entered city, email and the same unified phone control.
- The phone control is a single visual field containing the country/dial-code selector and national number input side by side; it is shared by all forms using `PhoneField`.

### Orders

Both order modules are implemented against the Swagger DTOs. Prices and totals remain server-owned; requests send only the party id and article quantities.

| Module          | Create                            | Detail                                | Lifecycle                        | List filter                                             |
| --------------- | --------------------------------- | ------------------------------------- | -------------------------------- | ------------------------------------------------------- |
| Customer orders | `POST /api/commandes-client`      | `GET /api/commandes-client/{id}`      | validate, ship, deliver, cancel  | `EN_COURS`, `VALIDEE`, `EXPEDIEE`, `LIVREE`, `ANNULEE`  |
| Supplier orders | `POST /api/commandes-fournisseur` | `GET /api/commandes-fournisseur/{id}` | receive, partial receive, cancel | `EN_ATTENTE`, `RECUE_PARTIELLEMENT`, `RECUE`, `ANNULEE` |

Customer order validation uses `PUT /api/commandes-client/{id}/valider` and generates stock exits. Supplier orders have no `valider` endpoint; full validation is the reception operation `PUT /api/commandes-fournisseur/{id}/receptionner`, with partial reception at `/receptionner-partiel`. Both lists have a gold “New order” CTA, translated responsive forms, row-click navigation and status filters.

### Quality status

- Current unit/component suite: **111 passing tests**; the 19 live audit cases are skipped unless `LIVE=1` or `npm run test:live` is used.
- TypeScript typecheck passes with `npm run typecheck`.
- CI runs typecheck, lint and tests; pre-commit uses oxlint and formatting on staged files.

---

## Architecture

```
src/
├── api/            # axios client + interceptors (JWT, ApiError, field errors)
├── app/            # providers (QueryClient, Toaster, Theme) + router
├── components/
│   ├── ui/         # 14 design-system primitives (Button, Card, Dialog, Badge…)
│   ├── data-table/ # DataTable suite (TanStack v9): toolbar, pagination, cells
│   ├── forms/      # FormDialog (RHF+zod), ConfirmDialog, FormFields (Controller)
│   ├── feedback/   # FeedbackStates, NotFoundPage, ErrorPage
│   └── layout/     # AppLayout, Sidebar (role-filtered nav), Header, bell
├── features/       # ONE FOLDER PER BACKEND RESOURCE — the core convention:
│   └── <feature>/
│       ├── api/          # endpoint calls; unwraps axios + maps DTO → domain
│       │   └── mappers.ts# the ONLY place that sees raw DTOs (int64 → string ids)
│       ├── types/        # XRequestDTO/XResponseDTO (wire) + domain models
│       ├── schemas/      # zod schemas mirroring the request DTO (French messages)
│       ├── hooks/        # query-key factory + typed mutations + toasts
│       ├── components/   # shared within the feature (forms, badges)
│       ├── pages/        # route pages
│       └── translations/ # fr.json / en.json — auto-registered by i18n glob
├── lib/            # constants (API_ENDPOINTS pinned to swagger), formatters, permissions, toast
├── stores/         # zustand: auth (user only), ui (theme, sidebar)
└── styles/         # design tokens (light/dark), Tailwind theme
```

### Conventions that matter

- **The "Categories pattern"** (reference: `src/features/categories/`) — every feature: pin swagger DTOs → mapper per endpoint → API returns unwrapped domain types → zod mirrors the request DTO → hooks with a `xxxKeys` factory; mutations invalidate `all` + `detail` and toast on success; errors surface via the global `MutationCache` (opt-out with `{ handled: true }`).
- **Backend paths are French** (`/clients`, `/fournisseurs`, `/commandes-client`, `/ventes`…) — `API_ENDPOINTS` in `src/lib/constants.ts` is the single source; do not "translate" them.
- **Domain ids are strings** — swagger sends int64; converting at the mapper avoids JS precision loss. Write-mappers convert back with a safe-integer guard.
- **Domain models are type aliases, not interfaces** — required by TanStack Table v9's `RowData` constraint.
- **Role gating in depth** — nav visibility (`lib/navigation.ts`), `RoleRoute` on the route group, and a `hasRole` re-check in admin pages (deep-link defense).
- **Stock side effects** — order validation (stock exits) and supplier-order reception (stock entries) invalidate `stock`/`articles` queries; the POS checkout does the same.

### Auth

JWT-only (swagger v1.0 has no refresh token): the token lives in `localStorage` (single source, read by the axios interceptor); the user object lives in the persisted zustand store. `ProtectedRoute` awaits a `/auth/me` bootstrap on mount — 401 purges the token; network errors fall back to the persisted user.

### i18n

`fr`/`en`. Global keys in `src/i18n/resources.ts`; **feature namespaces are auto-loaded** via `import.meta.glob` over `features/*/translations/` — dropping a JSON file there is the whole registration step.

---

## Testing

```bash
npm test                    # unit/component suite
npm run test:live           # opt-in networked audit (requires the API)
```

Covered today: formatters and stock-status boundaries, permissions, country/phone helpers, Swagger schema parity, article mappers (int64 safety, VAT/TTC conversion and optional-photo normalization), dashboard/platform adapters, i18n parity, and the DataTable (render/filter/sort/pagination/empty states). New tests go next to the code as `*.test.ts(x)`; jest-dom matchers and a `matchMedia` stub are in `src/test/setup.ts`.

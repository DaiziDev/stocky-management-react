# SGS Frontend — Final Architecture

## 1. Overview

This document defines the final frontend architecture for the SGS (Stock Management System).

The architecture is based on a **feature-based organization**. Each business feature owns its pages, components, hooks, API functions, validation schemas, types, and translations.

Recommended stack:

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui
- Axios
- TanStack Query
- Zustand
- React Hook Form
- Zod
- TanStack Table
- i18next + react-i18next
- Lucide React
- Recharts
- date-fns
- Sonner
- Vitest + React Testing Library
- Playwright
- ESLint + Prettier

---

## 2. Final Project Structure

```text
SGS-app/
│
├── public/
│
├── src/
│   │
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── LanguageSwitcher.tsx
│   │   │   └── ThemeSwitcher.tsx
│   │   ├── data-table/
│   │   ├── forms/
│   │   └── feedback/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── companies/
│   │   ├── users/
│   │   ├── categories/
│   │   ├── articles/
│   │   ├── customers/
│   │   ├── suppliers/
│   │   ├── customer-orders/
│   │   ├── supplier-orders/
│   │   ├── sales/
│   │   ├── stock/
│   │   └── notifications/
│   │
│   ├── api/
│   │   ├── client.ts
│   │   ├── interceptors.ts
│   │   └── generated/
│   │
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── resources.ts
│   │   └── types.ts
│   │
│   ├── stores/
│   │   ├── auth.store.ts
│   │   ├── theme.store.ts
│   │   └── ui.store.ts
│   │
│   ├── routes/
│   │   ├── ProtectedRoute.tsx
│   │   └── RoleRoute.tsx
│   │
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── usePagination.ts
│   │   └── useMediaQuery.ts
│   │
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── permissions.ts
│   │   ├── formatters.ts
│   │   ├── constants.ts
│   │   └── error-handler.ts
│   │
│   ├── types/
│   │   ├── api.types.ts
│   │   └── common.types.ts
│   │
│   ├── styles/
│   │   └── index.css
│   │
│   └── main.tsx
│
├── .env
├── .env.example
├── .gitignore
├── eslint.config.js
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 3. Feature-Based Architecture

Each major feature follows this structure:

```
feature/
├── api/
├── components/
├── hooks/
├── schemas/
├── types/
├── pages/
└── translations/
    ├── fr.json
    └── en.json
```

For example:

```
features/articles/
├── api/
│   └── articles.api.ts
├── components/
│   ├── ArticleTable.tsx
│   ├── ArticleForm.tsx
│   ├── ArticleFilters.tsx
│   └── ArticleActions.tsx
├── hooks/
│   ├── useArticles.ts
│   ├── useArticle.ts
│   ├── useCreateArticle.ts
│   ├── useUpdateArticle.ts
│   └── useDeleteArticle.ts
├── schemas/
│   └── article.schema.ts
├── types/
│   └── article.types.ts
├── pages/
│   ├── ArticlesPage.tsx
│   └── ArticleDetailsPage.tsx
└── translations/
    ├── fr.json
    └── en.json
```

A feature should contain only the folders it actually needs. Do not create empty abstractions just to follow the structure.

---

## 4. Routing and Page Rendering

React does not automatically render files located in feature `pages/` folders.

React Router maps URLs to page components.

Example:

```
/articles
    ↓
React Router
    ↓
features/articles/pages/ArticlesPage.tsx

/articles/:id
    ↓
React Router
    ↓
features/articles/pages/ArticleDetailsPage.tsx
```

The actual route definitions live in:

```
src/app/router.tsx
```

Reusable route guards live in:

```
src/routes/
├── ProtectedRoute.tsx
└── RoleRoute.tsx
```

Authenticated pages use one shared layout:

```
AppLayout
├── Sidebar
├── Header
└── Outlet
    ├── DashboardPage
    ├── ArticlesPage
    ├── CustomersPage
    ├── SuppliersPage
    ├── SalesPage
    └── StockPage
```

This avoids duplicating the sidebar and header inside every page.

---

## 5. Application Startup

The application entry point is:

```
src/main.tsx
```

The rendering chain is:

```
main.tsx
    ↓
App.tsx
    ↓
RouterProvider
    ↓
router.tsx
    ↓
current URL
    ↓
matching page
```

**Unauthenticated user:**
```
Application starts
        ↓
Authentication check
        ↓
Not authenticated
        ↓
/login
```

**Authenticated user:**
```
Application starts
        ↓
Authentication check
        ↓
Authenticated
        ↓
/dashboard
```

Therefore:

- `/login` is the first interface for an unauthenticated user.
- `/dashboard` is the first interface after successful authentication.

---

## 6. State Management

Different types of state use different tools.

### TanStack Query — Server State

TanStack Query manages data received from the Spring Boot API:

- Articles
- Customers
- Suppliers
- Customer orders
- Supplier orders
- Sales
- Stock
- Notifications
- Dashboard KPIs
- Users
- Companies

**Do not duplicate these datasets inside Zustand.**

Typical flow:

```
Component
    ↓
Feature hook
    ↓
TanStack Query
    ↓
Feature API
    ↓
Axios client
    ↓
Spring Boot API
```

### Zustand — Client/Application State

Zustand is reserved for client-side state such as:

- Authentication UI state
- Theme
- Sidebar state
- UI preferences

Stores:

```
src/stores/
├── auth.store.ts
├── theme.store.ts
└── ui.store.ts
```

**Do not create one giant Zustand store containing every business entity.**

### React local state

Temporary component state stays inside the component using React state mechanisms.

### React Hook Form + Zod

- React Hook Form manages form state.
- Zod manages validation schemas.
- `@hookform/resolvers` connects them.

---

## 7. API Architecture

There is one central Axios client:

```
src/api/
├── client.ts
├── interceptors.ts
└── generated/
```

Each feature owns its API functions:

```
features/articles/api/articles.api.ts
features/customers/api/customers.api.ts
features/stock/api/stock.api.ts
```

Communication:

```
React Page
    ↓
Feature Component
    ↓
Feature Hook
    ↓
Feature API
    ↓
Central Axios Client
    ↓
Spring Boot REST API
    ↓
PostgreSQL
```

The central Axios layer handles common concerns such as:

- Base URL
- JSON headers
- JWT authorization
- Request interceptors
- Response interceptors
- Authentication failures
- Common API errors

Example environment variable:

```
VITE_API_URL=http://localhost:8081/api
```

---

## 8. Authentication and Authorization

Authentication is organized under:

```
features/auth/
```

The frontend handles:

- Login
- Registration
- Current user
- Authentication state
- Redirects
- Protected routes
- Role-aware UI

Known roles:

- ADMIN
- GESTIONNAIRE
- VENDEUR

Frontend authorization is for user experience. The backend remains the real security boundary.

```
Frontend
    ↓
Hide/disable unauthorized UI
    ↓
Backend
    ↓
Actually enforce authorization
```

The frontend must never be treated as the source of truth for security.

---

## 9. Internationalization

The application supports French and English.

The i18n engine/configuration is global:

```
src/i18n/
├── index.ts
├── resources.ts
└── types.ts
```

The translation dictionaries are owned by individual features:

```
features/articles/translations/
├── fr.json
└── en.json
features/customers/translations/
├── fr.json
└── en.json
```

This keeps feature-specific translations close to the code that uses them.

### Global/common translations

A small global namespace should exist for truly common words and actions:

- Save
- Cancel
- Delete
- Edit
- Close
- Loading
- Search
- Yes
- No
- Actions

Do not duplicate these in every feature.

### Translation usage

Example:

```tsx
const { t } = useTranslation("articles");

return <h1>{t("title")}</h1>;
```

Architecture:

```
Global i18n engine
       ↓
Feature namespace
       ↓
Feature translation files
       ↓
Feature component
```

---

## 10. Dark Mode and Global Styling

Dark mode is a global application concern.

Theme state:

```
src/stores/theme.store.ts
```

Global CSS:

```
src/styles/index.css
```

The global stylesheet is imported once from `main.tsx`.

It should contain:

- Global CSS variables/design tokens
- Base/reset styles
- Body styling
- Global typography
- Theme variables
- Tailwind integration
- Global focus/accessibility rules
- Only genuinely global CSS rules

Feature-specific styling should normally use Tailwind classes or stay close to the component.

### Theme flow:

```
ThemeSwitcher
      ↓
theme.store
      ↓
global theme
      ↓
entire application
```

Individual features must not create separate theme systems.

---

## 11. Shared Components

`src/components/` contains reusable application components.

### UI
`components/ui/`

Examples:
- Button
- Input
- Dialog
- Select
- Badge
- Card

### Layout
`components/layout/`

Examples:
- AppLayout
- Sidebar
- Header
- LanguageSwitcher
- ThemeSwitcher

### Data tables
`components/data-table/`

Reusable table infrastructure can live here.

### Feedback
`components/feedback/`

Examples:
- LoadingState
- EmptyState
- ErrorState

Feature-specific components remain inside their feature.

---

## 12. Routing Map

The application can use routes such as:

- `/login`
- `/dashboard`
- `/companies`
- `/users`
- `/catalog/categories`
- `/catalog/articles`
- `/customers`
- `/customers/:id`
- `/suppliers`
- `/suppliers/:id`
- `/customer-orders`
- `/customer-orders/:id`
- `/supplier-orders`
- `/supplier-orders/:id`
- `/sales`
- `/stock`
- `/stock/movements`
- `/stock/alerts`
- `/notifications`
- `/profile`
- `/settings`

The route definitions remain centralized in:

```
src/app/router.tsx
```

---

## 13. Navigation Flow

Example:

```
User is on:
/dashboard

        ↓

Clicks "Articles"

        ↓

Router navigates to:
/articles

        ↓

React Router matches route

        ↓

ArticlesPage is rendered

        ↓

ArticlesPage calls:
useArticles()

        ↓

TanStack Query requests data

        ↓

articles.api.ts

        ↓

Axios client

        ↓

Spring Boot
```

Normal internal navigation does not require a full browser page reload.

---

## 14. Responsibility Matrix

| Concern | Responsible layer |
|---------|-------------------|
| URL → Page | React Router |
| Page layout | AppLayout |
| Shared UI | components/ |
| Business UI | features/*/components |
| Server data | TanStack Query |
| Client state | Zustand |
| Forms | React Hook Form |
| Validation | Zod |
| HTTP | Axios |
| Feature API | features/*/api |
| Global API configuration | src/api |
| Authentication | features/auth |
| Route protection | routes/ |
| Translation engine | src/i18n |
| Feature translations | features/*/translations |
| Theme state | stores/theme.store.ts |
| Global CSS | styles/index.css |
| Generic hooks | src/hooks |
| Generic utilities | src/lib |
| Global types | src/types |

---

## 15. Architectural Rules

- Business code belongs to a feature.
- Reusable UI belongs to components/.
- API infrastructure belongs to api/.
- Feature-specific API calls belong to the feature.
- Server/API state belongs to TanStack Query.
- Client/application state belongs to Zustand.
- Do not create one giant global Zustand store.
- Feature translations stay inside the feature.
- Truly common translations can be global.
- Global CSS stays focused on global concerns.
- Do not duplicate Axios configuration inside features.
- Do not duplicate Sidebar/Header inside individual pages.
- Feature-specific types stay inside the feature.
- Feature-specific validation schemas stay inside the feature.
- Frontend permission checks improve UX; backend authorization provides security.
- Avoid creating abstractions before they are needed.
- A feature does not need every possible folder if it does not use them.

---

## 16. Complete Application Flow

```
                         SGS-app
                              │
                ┌─────────────┴─────────────┐
                │                           │
             ROUTING                    GLOBAL UI
                │                           │
        React Router                 Layout / Theme
                │                    / Translation
                │                           │
                └─────────────┬─────────────┘
                              │
                          FEATURES
                              │
       ┌──────────┬───────────┼───────────┬───────────┐
       │          │           │           │           │
      Auth    Dashboard    Articles    Customers    Stock
       │          │           │           │           │
       └──────────┴───────────┼───────────┴───────────┘
                              │
                       Feature Hooks
                              │
                       TanStack Query
                              │
                       Feature API
                              │
                         Axios Client
                              │
                       Spring Boot API
                              │
                          PostgreSQL
```

---

## 17. Final Architectural Philosophy

The project follows three main boundaries:

**Business code**
→ features/

**Reusable code**
→ components/

**Infrastructure**
→ api/, i18n/, stores/, routes/, lib/, hooks/, types/, styles/

Examples:

```
Article API           → features/articles/api/
Article components    → features/articles/components/
Article translations  → features/articles/translations/
Article types         → features/articles/types/
Article validation    → features/articles/schemas/
Article pages         → features/articles/pages/

Reusable Button       → components/ui/
Global Axios          → api/
Global theme          → stores/theme.store.ts
Global i18n config    → i18n/
Global CSS            → styles/index.css
```

This architecture keeps SGS modular, maintainable, scalable, and easy for another developer to understand.

It intentionally avoids unnecessary enterprise complexity while providing clear boundaries for the application's business features and infrastructure.
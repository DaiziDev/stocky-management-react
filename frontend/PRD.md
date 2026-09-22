# Product Requirements Document (PRD) — SGS
## Stock Management System

**Version:** 1.0  
**Date:** September 2026  
**Product type:** Multi-company stock management REST API  
**Source:** Functional Requirements Document generated from the implemented SGS backend.

---

## 1. Product Overview

### 1.1 Product vision

SGS is a multi-company stock management application that enables businesses to manage their products, inventory, customers, suppliers, purchases, sales, users, and stock movements from a single system.

The product must provide reliable inventory tracking with complete traceability: every stock variation must be associated with a stock movement and historical record.

### 1.2 Product objective

The primary objective is to provide companies with a secure and centralized system that allows them to:

- Manage their company and users.
- Manage product categories and articles.
- Manage customers and suppliers.
- Create and process customer orders.
- Create and receive supplier orders.
- Record counter sales.
- Track stock levels and stock movements.
- Detect low-stock articles.
- Calculate inventory valuation.
- Monitor business KPIs.
- Notify users about low stock.
- Send transactional emails for orders.

### 1.3 Product scope

The current product scope includes:

- Authentication and JWT security.
- Multi-company / multi-tenant management.
- User and role management.
- Company management.
- Category management.
- Article management.
- Customer management.
- Supplier management.
- Customer order management.
- Supplier order management.
- Counter sales.
- Stock state, alerts, and valuation.
- Stock movement management.
- Low-stock notifications.
- Dashboard KPIs.
- Automatic order emails.
- Swagger / OpenAPI documentation.

---

## 2. Users and Roles

SGS supports three user roles.

| Role | Product responsibility |
|---|---|
| **ADMIN** | Full administrative access, including company and user management. |
| **GESTIONNAIRE** | Manages catalogue, suppliers, orders, stock, sales, and reports. |
| **VENDEUR** | Performs counter sales and accesses relevant article/customer information. |

### Permission model

Permissions are enforced server-side.

- **ADMIN:** administrative operations.
- **GESTION:** ADMIN + GESTIONNAIRE permissions for catalogue writes, orders, suppliers, stock operations, valuation, and KPIs.
- **TOUS:** access available to all three roles for catalogue/customer/stock reads, sales, and notifications.

The effective role must be read from the database for every request rather than relying exclusively on the JWT role claim.

---

## 3. Multi-Tenancy Requirements

### Requirement MT-01 — Company isolation

Every business entity must belong to a company.

This includes, at minimum:

- Articles.
- Customers.
- Suppliers.
- Orders.
- Sales.
- Stock movements.
- Users.

### Requirement MT-02 — Current company context

The system must determine the connected user's company from the authenticated JWT/request context.

### Requirement MT-03 — Cross-company protection

A user must never be able to access another company's business data.

When a requested resource belongs to another company, the API must respond with **404 Not Found** rather than **403 Forbidden**, preventing disclosure of the existence of another company's data.

---

## 4. Authentication and Security

### Requirement SEC-01 — Login

Users must be able to authenticate using their login and password.

**Endpoint:** `POST /api/auth/login`

The response must provide:

- JWT.
- User information.

### Requirement SEC-02 — User registration

An ADMIN must be able to create user accounts within their company.

**Endpoint:** `POST /api/auth/register`

Passwords must be securely hashed using BCrypt.

### Requirement SEC-03 — Current user profile

Authenticated users must be able to retrieve their profile.

**Endpoint:** `GET /api/auth/me`

### Requirement SEC-04 — Stateless authentication

Every protected API request must include:

`Authorization: Bearer <token>`

The API must not depend on server-side sessions.

### Requirement SEC-05 — Password security

Passwords must never be stored as plain text.

### Requirement SEC-06 — Default bootstrap account

On first startup, the system creates a demo company and administrator account for development/bootstrap purposes.

Production deployments must replace the demo credentials.

---

## 5. Company Management

### User story

**As an ADMIN, I want to manage companies so that the system can support multiple businesses.**

### Functional requirements

The system must allow an ADMIN to:

- List companies.
- View company details.
- Create a company.
- Update a company.
- Delete a company.

### Company information

A company contains:

- Unique name.
- Street/address.
- City.
- Postal code.
- Country.
- Email.
- Phone number.

---

## 6. User Management

### User story

**As an ADMIN, I want to manage users in my company so that I can control access to the system.**

### Functional requirements

An ADMIN must be able to:

- List users belonging to their company.
- View a user.
- Update user information.
- Change the user's role.
- Delete a user.

### Business rules

- User login must be unique.
- Login changes are not currently supported.
- Password changes are outside the current user-management scope.
- User creation is performed through registration.
- Users cannot access accounts belonging to another company.

---

## 7. Catalogue Management

### 7.1 Categories

**User story:**  
As a manager, I want to organize articles into categories so that the catalogue remains structured.

The system must support:

- Create category.
- List categories.
- View category.
- Update category.
- Delete category.

A category contains:

- Unique code.
- Designation.

A category can contain multiple articles.

### 7.2 Articles

**User story:**  
As a manager, I want to manage articles so that I can maintain the company's product catalogue and inventory.

The system must support full CRUD for articles.

An article contains:

| Field | Requirement |
|---|---|
| `codeArticle` | Required and unique |
| `designation` | Required |
| `prixUnitaireHt` | Required purchase/excluding-tax price |
| `tauxTva` | Required VAT rate |
| `prixUnitaireTtc` | Required selling/inclusive-tax price |
| `photo` | Optional image reference/URL |
| `categorie` | Optional category |
| `stockActuel` | Derived through stock movements |
| `seuilMin` | Optional minimum-stock threshold |

### Critical stock rule

`stockActuel` must never be modified directly by normal business operations. Stock changes must pass through the stock movement mechanism.

---

## 8. Customer Management

### User story

**As a user, I want to manage customer records so that I can associate customers with orders and sales.**

The system must support full CRUD for customers.

A customer contains:

- Last name.
- First name.
- Address.
- Photo.
- Email.
- Phone.

The customer must belong to the company of the creating user.

Customers can be associated with customer orders and sales.

---

## 9. Supplier Management

### User story

**As a manager, I want to manage suppliers so that I can create and process purchase orders.**

The system must support full CRUD for suppliers.

A supplier contains:

- Name.
- Address.
- Email.
- Phone.

The supplier belongs to the current company and can be used in supplier orders.

---

## 10. Customer Orders

### User story

**As a manager, I want to create customer orders and validate them so that stock is reduced only when the order is confirmed.**

### Order lifecycle

```text
EN_COURS
   ├── validate → VALIDEE
   └── cancel   → ANNULEE
```

### Functional requirements

The system must allow users to:

- List company customer orders.
- View order details.
- Create a customer order.
- Validate an order.
- Cancel an order while it is in progress.

### Business rules

1. New orders start with `EN_COURS`.
2. Validation is only possible from `EN_COURS`.
3. Validation generates one `SORTIE` stock movement per order line.
4. If one line has insufficient stock, the complete validation must fail and roll back.
5. Cancellation is only possible while the order is `EN_COURS`.
6. A validated order cannot currently be cancelled.
7. The TTC price must be frozen on each order line at creation.
8. Order creation is transactional.
9. Orders receive readable sequential codes such as `CC-000001`.
10. A confirmation email is sent to the customer when an order is created, when an email exists.
11. Email failure must not prevent order creation.

---

## 11. Supplier Orders

### User story

**As a manager, I want to create supplier orders and receive them so that purchased stock is added to inventory.**

### Order lifecycle

```text
EN_ATTENTE
   ├── receive → RECUE
   └── cancel  → ANNULEE
```

### Functional requirements

The system must allow users to:

- List supplier orders.
- View supplier order details.
- Create supplier orders.
- Receive supplier orders.
- Cancel pending supplier orders.

### Business rules

1. New supplier orders start with `EN_ATTENTE`.
2. Receiving is only possible from `EN_ATTENTE`.
3. Receiving creates one `ENTREE` stock movement per line.
4. A received order cannot be received twice.
5. Cancellation is only possible while pending.
6. HT prices are frozen on order lines at creation.
7. Orders receive readable sequential codes such as `CF-000001`.
8. A purchase-order email is sent to the supplier when the order is created, when an email exists.
9. Email failure must not block order creation.

---

## 12. Counter Sales

### User story

**As a VENDEUR, I want to record a counter sale so that the sale immediately updates stock.**

### Functional requirements

The system must allow users to:

- List sales.
- View a sale.
- Create a sale.

### Business rules

1. Stock is decreased immediately when the sale is created.
2. No separate validation workflow is required.
3. Sales cannot be updated.
4. Sales cannot be deleted.
5. Customer association is optional.
6. Anonymous/counter sales are supported.
7. TTC prices are frozen at sale time.
8. Sales receive readable sequential codes such as `VT-000001`.
9. If any line lacks sufficient stock, the entire sale is rejected.
10. Every sale creates traced `SORTIE` stock movement(s).

Sales are treated as immutable historical facts.

---

## 13. Inventory Management

### 13.1 Stock state

The stock module is a derived view rather than an independent stock database.

The system must provide:

- Current stock for company articles.
- Minimum-stock threshold.
- Stock status.

**Endpoint:** `GET /api/stock/etat`

### 13.2 Low-stock alerts

The system must identify articles whose current stock is less than or equal to the configured minimum threshold.

**Endpoint:** `GET /api/stock/alertes`

If no threshold is configured, no low-stock alert is generated for that article.

### 13.3 Inventory valuation

The system must calculate total inventory value using:

```text
Total stock value =
Σ (current stock × HT unit price)
```

**Endpoint:** `GET /api/stock/valorisation`

---

## 14. Stock Movements and Traceability

### User story

**As a manager, I want every stock change to be traceable so that inventory history remains auditable.**

### Movement types

| Type | Effect | Origin |
|---|---|---|
| `ENTREE` | Stock increases | Supplier order receiving |
| `SORTIE` | Stock decreases | Customer order validation or sale |
| `AJUSTEMENT` | Stock increases/decreases | Manual correction |

### Functional requirements

Users must be able to:

- View movement history.
- Filter movements by article.
- Filter movements by movement type.
- Create manual stock adjustments.

### Critical traceability rules

1. No business operation may directly modify article stock.
2. Every stock change must create a stock movement.
3. Stock modification and movement creation must occur in the same transaction.
4. Every movement stores the stock level after the movement.
5. Automatic movements can reference their originating order/sale.
6. Manual adjustments require a reason.
7. Manual adjustments may use positive or negative quantities.
8. Stock must never become negative.
9. An operation that would produce negative stock must be completely rolled back.

---

## 15. Notifications

### User story

**As a user, I want to be notified when stock reaches a critical level so that I can react before inventory runs out.**

### Functional requirement

The system must expose active low-stock notifications.

**Endpoint:** `GET /api/notifications`

A notification contains:

- Notification type: `STOCK_BAS`.
- Readable message.
- Article ID.
- Article designation.

### Current limitation

Notifications are calculated dynamically.

The current product does not provide:

- Persistent notification records.
- Read/unread state.
- Notification history.

---

## 16. Dashboard

### User story

**As a business user, I want to see the main indicators of my company when I access the dashboard so that I can quickly understand the current business situation.**

### Dashboard KPI requirements

The dashboard must provide:

| KPI | Definition |
|---|---|
| **Stock value** | Sum of current stock × HT unit price |
| **Articles in alert** | Number of articles at/below minimum threshold |
| **Customer orders in progress** | Number of `EN_COURS` customer orders |
| **Pending supplier orders** | Number of `EN_ATTENTE` supplier orders |
| **Sales this month** | Number of sales since the first day of the current month |
| **Revenue this month** | Sum of current month's sale totals |

**Endpoint:** `GET /api/dashboard/kpis`

---

## 17. Email Notifications

### Customer order email

When a customer order is created:

- Send an HTML confirmation email.
- Recipient: customer's email.
- Do not block the business operation if email sending fails.

### Supplier order email

When a supplier order is created:

- Send an HTML purchase-order email.
- Recipient: supplier's email.
- Do not block the business operation if email sending fails.

### Email requirements

- Emails are sent only when a recipient email exists.
- SMTP configuration is supplied through environment variables.
- SMTP failures must be logged but must not cause the order transaction to fail.

---

## 18. Core Business Rules

| ID | Business rule |
|---|---|
| BR-02 | Customer order validation creates one OUT movement per line. |
| BR-03 | Supplier order receiving creates one IN movement per line. |
| BR-04 | No stock variation occurs without a traced stock movement. |
| BR-06 | Every manual stock adjustment requires a reason. |
| BR-07 | Supplier order creation sends a purchase-order email when possible. |
| BR-08 | Customer order creation sends a confirmation email when possible. |
| BR-09 | Stock reaching the minimum threshold triggers a low-stock notification. |
| BR-10 | Stock can never become negative. |
| BR-11 | Order and sale prices are frozen at operation time. |
| BR-12 | Orders and sales use readable sequential business codes. |
| BR-13 | Company data is isolated between tenants. |
| BR-14 | Multi-line stock operations are atomic. |
| BR-15 | Sales are immutable. |

---

## 19. End-to-End Business Flows

### 19.1 Purchasing / replenishment

```text
Create supplier
      ↓
Create supplier order
      ↓
Status = EN_ATTENTE
      ↓
Purchase-order email
      ↓
Receive order
      ↓
Status = RECUE
      ↓
ENTREE stock movements
      ↓
Available stock increases
```

### 19.2 Customer order

```text
Create customer
      ↓
Create customer order
      ↓
Status = EN_COURS
      ↓
Customer confirmation email
      ↓
Validate order
      ↓
Status = VALIDEE
      ↓
SORTIE stock movements
      ↓
Available stock decreases
```

### 19.3 Counter sale

```text
Create sale
      ↓
Validate stock availability
      ↓
Create sale
      ↓
Immediate SORTIE stock movements
      ↓
Available stock decreases
```

### 19.4 Inventory correction

```text
View stock state
      ↓
Identify discrepancy
      ↓
Create AJUSTEMENT
      ↓
Provide reason
      ↓
Update stock through movement service
      ↓
Persist historical movement
```

---

## 20. Data Integrity and Transaction Requirements

The system must protect inventory consistency.

### Atomic operations

The following operations must be transactional:

- Customer order creation.
- Customer order validation.
- Supplier order receiving.
- Sale creation.
- Stock movement creation and stock update.

If a single line fails because of invalid data or insufficient stock, the complete operation must roll back.

### Price snapshots

Historical operations must retain the relevant price at the time of the operation.

- Customer order lines: TTC snapshot.
- Sale lines: TTC snapshot.
- Supplier order lines: HT snapshot.

Changing an article's current price must not rewrite historical operations.

---

## 21. API Product Surface

The product exposes REST resources for:

```text
/api/auth
/api/entreprises
/api/utilisateurs
/api/categories
/api/articles
/api/clients
/api/fournisseurs
/api/commandes-client
/api/commandes-fournisseur
/api/ventes
/api/stock
/api/mouvements-stock
/api/notifications
/api/dashboard
```

The API must return appropriate business errors:

- **400:** invalid business operation or violated business rule.
- **403:** authenticated user lacks permission.
- **404:** resource does not exist or belongs to another company.

---

## 22. Non-Functional Requirements

### Security

- JWT-based stateless authentication.
- BCrypt password hashing.
- Server-side role authorization.
- Multi-tenant data isolation.
- No cross-company data disclosure.

### Reliability

- Transactional stock operations.
- No negative inventory.
- No partial multi-line operations.
- Email failures must not break order creation.

### Traceability

Every inventory variation must leave a historical stock movement.

### Maintainability

The API should preserve clear separation between:

- Authentication/security.
- Business entities.
- Business services.
- Stock management.
- Notifications.
- Dashboard/KPI computation.

### Documentation

The API must expose interactive OpenAPI documentation through Swagger UI.

---

## 23. Technical Constraints

The current implementation uses:

- **Java 17**
- **Spring Boot 3.4.1**
- Spring Web
- Spring Data JPA
- Spring Validation
- Spring Security
- Spring Mail
- **PostgreSQL**
- **JWT / jjwt 0.12.6**
- Lombok
- springdoc-openapi 2.8.4
- Maven

The server runs on port **8081**.

Swagger/OpenAPI documentation is exposed through:

- `/swagger-ui.html`
- `/api-docs`
- `/v3/api-docs`

---

## 24. Out of Scope

The following capabilities are explicitly outside the current product scope:

1. Cancelling an already validated customer order.
2. Cancelling an already received supplier order.
3. Updating an existing sale.
4. Deleting a sale.
5. Password change.
6. Email-based password reset.
7. Real image/photo upload for articles and customers.
8. Persistent notification history.
9. Notification read/unread state.
10. Dedicated email-template engine.

These may be considered future product evolutions.

---

## 25. Future Evolution Candidates

Based strictly on the documented out-of-scope items, future versions may consider:

- Reverse stock movements for order cancellations.
- Credit-note/refund workflows.
- Password-management workflows.
- Password reset by email.
- Real file/image upload.
- Persistent notification center.
- Read/unread notification state.
- Notification history.
- Dedicated HTML email template management.

---

## 26. Product Success Criteria

The product can be considered functionally successful when:

- Users can securely authenticate and operate within their company.
- Each company can manage its own catalogue, customers, suppliers, orders, sales, and stock.
- No user's operation can expose another company's data.
- Stock changes are always traceable.
- Stock can never become negative.
- Customer orders correctly decrease stock only after validation.
- Supplier order receiving correctly increases stock.
- Counter sales immediately decrease stock.
- Inventory valuation and low-stock indicators reflect current stock.
- Dashboard KPIs correctly represent the connected company's activity.
- Transactional failures do not leave partial stock operations.
- Historical prices remain stable after catalogue price changes.
- Sales remain immutable.
- API documentation remains available for consumers of the REST API.

---

## 27. Product Reference

This PRD is derived from the SGS Functional Requirements Document, which describes the currently implemented backend scope, actors, business rules, API resources, business flows, technical conventions, and explicitly excluded features.

**Source document:** Functional Requirements Document — SGS, Version 1.0, September 2026.

import { describe, expect, it } from "vitest";
import type { ZodType } from "zod";

import { ArticlesSchema } from "@/features/articles/schemas";
import { AuthSchema } from "@/features/auth/schemas";
import { CategoriesSchema } from "@/features/categories/schemas";
import {
  CompaniesSchema,
  CompanyContactSchema,
} from "@/features/companies/schemas";
import { CustomersSchema } from "@/features/customers/schemas";
import { CustomerOrderSchema } from "@/features/customer-orders/schemas";
import { CompanyOnboardingSchema } from "@/features/platform/schemas";
import { SaleSchema } from "@/features/sales/schemas";
import { StockAdjustmentSchema } from "@/features/stock/schemas";
import {
  PartialReceptionSchema,
  SupplierOrderSchema,
} from "@/features/supplier-orders/schemas";
import { SuppliersSchema } from "@/features/suppliers/schemas";
import { UserCreateSchema, UserEditSchema } from "@/features/users/schemas";

/**
 * Required-field parity between every form schema and swagger.json.
 *
 * The project rule is that a field may only be mandatory on the frontend when
 * the backend contract marks it required — a stricter form rejects records the
 * API would have accepted. This suite encodes each DTO's `required` array as a
 * "minimal" payload: filling ONLY those fields must parse successfully.
 *
 * `swaggerDTO` names the contract shape each schema mirrors, so a future
 * contract change has an obvious place to be reflected.
 */
interface ParityCase {
  name: string;
  swaggerDTO: string;
  schema: ZodType;
  /** Values for exactly the fields the contract marks required. */
  minimal: Record<string, unknown>;
  /** Optional fields that must NOT block submission when left blank. */
  blankOptional?: Record<string, unknown>;
}

const cases: ParityCase[] = [
  {
    name: "login",
    swaggerDTO: "LoginRequest (login, motDePasse)",
    schema: AuthSchema,
    minimal: { login: "admin@sgs.local", motDePasse: "admin123" },
  },
  {
    name: "categories",
    swaggerDTO: "CategorieRequestDTO (code, designation)",
    schema: CategoriesSchema,
    minimal: { code: "CAT-1", designation: "Boissons" },
  },
  {
    name: "articles",
    swaggerDTO:
      "ArticleRequestDTO (codeArticle, designation, prixUnitaireHt, tauxTva, categorieId)",
    schema: ArticlesSchema,
    minimal: {
      code: "ART-1",
      designation: "Café moulu",
      unitPriceHt: 1500,
      vatRate: 0.1925,
      categoryId: "3",
    },
    blankOptional: { photo: undefined, minStock: undefined },
  },
  {
    name: "customers",
    swaggerDTO: "ClientRequestDTO (nom, prenom)",
    schema: CustomersSchema,
    minimal: { lastName: "Nkolo", firstName: "Awa" },
    blankOptional: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      postalCode: "",
      country: "",
      email: "",
      phone: "",
      photo: "",
    },
  },
  {
    name: "suppliers",
    swaggerDTO: "FournisseurRequestDTO (nom)",
    schema: SuppliersSchema,
    minimal: { name: "Sosucam" },
    blankOptional: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      postalCode: "",
      country: "",
      email: "",
      phone: "",
    },
  },
  {
    name: "companies (create)",
    swaggerDTO: "EntrepriseRequestDTO (nom)",
    schema: CompaniesSchema,
    minimal: { name: "SGS Trading SARL" },
    blankOptional: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      postalCode: "",
      country: "",
      email: "",
      phone: "",
    },
  },
  {
    name: "companies (update)",
    swaggerDTO: "EntrepriseUpdateDTO (nothing required)",
    schema: CompanyContactSchema,
    minimal: {},
    blankOptional: {
      addressLine1: "",
      city: "",
      postalCode: "",
      country: "",
      email: "",
      phone: "",
    },
  },
  {
    name: "platform onboarding",
    swaggerDTO:
      "AdminEntrepriseRequestDTO (nomEntreprise, adminPrenom, adminNom, adminLogin, adminMotDePasse)",
    schema: CompanyOnboardingSchema,
    minimal: {
      companyName: "Boulangerie Mvog-Ada",
      adminFirstName: "Awa",
      adminLastName: "Nkolo",
      adminLogin: "awa.nkolo",
      adminPassword: "motdepasse",
    },
    blankOptional: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      postalCode: "",
      country: "",
      companyEmail: "",
      companyPhone: "",
      adminEmail: "",
      adminPhone: "",
    },
  },
  {
    name: "customer order",
    swaggerDTO: "CommandeClientRequestDTO (clientId, lignes)",
    schema: CustomerOrderSchema,
    minimal: {
      customerId: "7",
      lines: [{ articleId: "3", quantity: 2 }],
    },
  },
  {
    name: "supplier order",
    swaggerDTO: "CommandeFournisseurRequestDTO (fournisseurId, lignes)",
    schema: SupplierOrderSchema,
    minimal: {
      supplierId: "4",
      lines: [{ articleId: "3", quantity: 10 }],
    },
  },
  {
    name: "partial reception",
    swaggerDTO: "ReceptionPartielleDTO (lignes) / LigneRecueDTO (ligneId)",
    schema: PartialReceptionSchema,
    minimal: { lines: [{ lineId: "12", receivedQuantity: 5 }] },
  },
  {
    name: "sale (POS)",
    swaggerDTO: "VenteRequestDTO (lignes; clientId optional)",
    schema: SaleSchema,
    minimal: { lines: [{ articleId: "3", quantity: 1 }] },
    blankOptional: { customerId: "" },
  },
  {
    name: "stock adjustment",
    swaggerDTO: "MvtStkRequestDTO (articleId, quantite, motif)",
    schema: StockAdjustmentSchema,
    minimal: { articleId: "3", quantity: -2, reason: "Casse" },
  },
  {
    name: "user (create)",
    swaggerDTO: "RegisterRequest (nom, prenom, login, motDePasse, role)",
    schema: UserCreateSchema,
    minimal: {
      lastName: "Nkolo",
      firstName: "Awa",
      login: "awa.nkolo",
      password: "motdepasse",
      role: "VENDEUR",
    },
    blankOptional: { email: "", phone: undefined },
  },
  {
    name: "user (edit)",
    swaggerDTO: "UtilisateurUpdateDTO (nom, prenom, role)",
    schema: UserEditSchema,
    minimal: { lastName: "Nkolo", firstName: "Awa", role: "VENDEUR" },
    blankOptional: { email: "", phone: undefined },
  },
];

describe("form schemas require exactly what swagger requires", () => {
  it.each(cases)(
    "$name accepts a payload with only $swaggerDTO filled",
    ({ schema, minimal }) => {
      const result = schema.safeParse(minimal);
      // Surface the offending fields rather than a bare `false`.
      const offenders = result.success
        ? []
        : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      expect(offenders).toEqual([]);
    },
  );

  it.each(cases.filter((c) => c.blankOptional))(
    "$name does not block on blank optional fields",
    ({ schema, minimal, blankOptional }) => {
      const result = schema.safeParse({ ...minimal, ...blankOptional });
      const offenders = result.success
        ? []
        : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      expect(offenders).toEqual([]);
    },
  );

  it.each(cases.filter((c) => Object.keys(c.minimal).length > 0))(
    "$name rejects an empty submission",
    ({ schema }) => {
      expect(schema.safeParse({}).success).toBe(false);
    },
  );
});

import { describe, expect, it } from "vitest";
import { CompanyOnboardingSchema, EMPTY_ONBOARDING } from "./index";
import { toAdminEntrepriseRequest } from "../api/mappers";

/**
 * The onboarding form is the one place where "required" must mirror the
 * backend exactly. swagger's `AdminEntrepriseRequestDTO.required` lists five
 * fields; anything else the user leaves blank has to go through.
 */

/** A submission filling ONLY what the contract marks required. */
const minimal = {
  ...EMPTY_ONBOARDING,
  companyName: "SGS Trading SARL",
  adminFirstName: "Awa",
  adminLastName: "Nkolo",
  adminLogin: "awa.nkolo",
  adminPassword: "motdepasse",
};

/** Field paths carrying an issue, e.g. ["companyEmail"]. */
const issuePaths = (value: unknown): string[] => {
  const result = CompanyOnboardingSchema.safeParse(value);
  return result.success
    ? []
    : result.error.issues.map((i) => String(i.path[0]));
};

describe("company onboarding schema", () => {
  it("accepts a submission with only the five contract-required fields", () => {
    expect(CompanyOnboardingSchema.safeParse(minimal).success).toBe(true);
  });

  it.each([
    "companyName",
    "adminFirstName",
    "adminLastName",
    "adminLogin",
    "adminPassword",
  ])("rejects a blank %s (required by the contract)", (field) => {
    expect(issuePaths({ ...minimal, [field]: "" })).toContain(field);
  });

  it.each([
    "addressLine1",
    "addressLine2",
    "postalCode",
    "city",
    "companyEmail",
    "companyPhone",
    "adminEmail",
    "adminPhone",
  ])("keeps %s optional — blank must not block submission", (field) => {
    expect(issuePaths({ ...minimal, [field]: "" })).not.toContain(field);
  });

  it("validates an email only once something is typed", () => {
    expect(issuePaths({ ...minimal, companyEmail: "" })).not.toContain(
      "companyEmail",
    );
    expect(issuePaths({ ...minimal, companyEmail: "pas-un-email" })).toContain(
      "companyEmail",
    );
    expect(
      issuePaths({ ...minimal, companyEmail: "contact@sgs.cm" }),
    ).not.toContain("companyEmail");
  });

  it("validates phone numbers against the SELECTED country", () => {
    // A 9-digit Cameroonian mobile is fine under +237…
    expect(
      issuePaths({ ...minimal, country: "CM", companyPhone: "677889900" }),
    ).not.toContain("companyPhone");

    // …but a 10-digit US number is not a valid Cameroonian one.
    expect(
      issuePaths({ ...minimal, country: "CM", companyPhone: "2015550123" }),
    ).toContain("companyPhone");

    // …and that same US number IS valid once the country is the US.
    expect(
      issuePaths({ ...minimal, country: "US", companyPhone: "2015550123" }),
    ).not.toContain("companyPhone");

    // Too short for any country.
    expect(
      issuePaths({ ...minimal, country: "CM", companyPhone: "12345" }),
    ).toContain("companyPhone");
  });

  it("checks the admin phone against the same country as the company", () => {
    expect(
      issuePaths({ ...minimal, country: "CM", adminPhone: "123" }),
    ).toContain("adminPhone");
  });
});

describe("onboarding payload mapper", () => {
  it("omits blank optional fields instead of sending empty strings", () => {
    const dto = toAdminEntrepriseRequest(minimal);

    expect(dto.nomEntreprise).toBe("SGS Trading SARL");
    expect(dto.adminLogin).toBe("awa.nkolo");
    expect(dto.adresse1).toBeUndefined();
    expect(dto.ville).toBeUndefined();
    expect(dto.mailEntreprise).toBeUndefined();
    expect(dto.numTelEntreprise).toBeUndefined();
  });

  it("composes E.164 numbers from the national part and the country", () => {
    const dto = toAdminEntrepriseRequest({
      ...minimal,
      country: "CM",
      companyPhone: "677889900",
      adminPhone: "699001122",
    });

    expect(dto.pays).toBe("CM");
    expect(dto.numTelEntreprise).toBe("+237677889900");
    expect(dto.adminNumTel).toBe("+237699001122");
  });

  it("never trims the password — spaces can be part of it", () => {
    const dto = toAdminEntrepriseRequest({
      ...minimal,
      adminPassword: "  secret  ",
    });
    expect(dto.adminMotDePasse).toBe("  secret  ");
  });
});

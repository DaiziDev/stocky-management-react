import { describe, expect, it } from "vitest";
import {
  countryFromDial,
  countryName,
  countryOptions,
  dialCode,
  expectedNationalLength,
  flagEmoji,
  fromE164,
  isValidNationalNumber,
  toE164,
  toIsoCountry,
} from "./countries";

describe("country helpers", () => {
  it("derives the flag emoji from the ISO code", () => {
    expect(flagEmoji("CM")).toBe("🇨🇲");
    expect(flagEmoji("FR")).toBe("🇫🇷");
    expect(flagEmoji("bad-code")).toBe("");
  });

  it("exposes the dial code of a country", () => {
    expect(dialCode("CM")).toBe("237");
    expect(dialCode("FR")).toBe("33");
  });

  it("localizes country names through Intl.DisplayNames", () => {
    expect(countryName("CM", "en")).toBe("Cameroon");
    expect(countryName("CM", "fr")).toBe("Cameroun");
  });

  it("sorts the options by localized name and carries flag + dial", () => {
    const options = countryOptions("fr");
    const cameroon = options.find((option) => option.isoCode === "CM");

    expect(cameroon).toEqual({
      isoCode: "CM",
      name: "Cameroun",
      dial: "237",
      flag: "🇨🇲",
    });

    const names = options.map((option) => option.name);
    expect([...names].sort(new Intl.Collator("fr").compare)).toEqual(names);
  });

  it("resolves a dial code back to a country", () => {
    expect(countryFromDial("237")).toBe("CM");
    expect(countryFromDial("+237")).toBe("CM");
    // Shared codes resolve to the designated primary country.
    expect(countryFromDial("1")).toBe("US");
    expect(countryFromDial("99999")).toBeUndefined();
  });

  it("knows how many digits a national number has per country", () => {
    expect(expectedNationalLength("CM")).toBe(9);
    expect(expectedNationalLength("US")).toBe(10);
  });
});

describe("phone number validation", () => {
  it("accepts a valid national number for the country", () => {
    expect(isValidNationalNumber("677889900", "CM")).toBe(true);
    expect(isValidNationalNumber("612345678", "FR")).toBe(true);
  });

  it("rejects a number that is wrong for the country", () => {
    expect(isValidNationalNumber("12345", "CM")).toBe(false);
    expect(isValidNationalNumber("677889900", "US")).toBe(false);
  });

  it("treats an empty value as valid — optionality is the schema's job", () => {
    expect(isValidNationalNumber("", "CM")).toBe(true);
    expect(isValidNationalNumber("   ", "CM")).toBe(true);
  });
});

describe("E.164 conversion", () => {
  it("composes and splits a number symmetrically", () => {
    expect(toE164("677889900", "CM")).toBe("+237677889900");
    expect(fromE164("+237677889900", "FR")).toEqual({
      isoCode: "CM",
      national: "677889900",
    });
  });

  it("returns undefined for an empty national part", () => {
    expect(toE164("", "CM")).toBeUndefined();
  });

  it("falls back to the given country when the value is not parseable", () => {
    expect(fromE164(undefined, "CM")).toEqual({
      isoCode: "CM",
      national: "",
    });
  });
});

describe("resolving a stored country string", () => {
  it("accepts an ISO code in any case", () => {
    expect(toIsoCountry("CM")).toBe("CM");
    expect(toIsoCountry("cm")).toBe("CM");
  });

  it("matches legacy free-text names in both UI languages", () => {
    expect(toIsoCountry("Cameroun")).toBe("CM");
    expect(toIsoCountry("Cameroon")).toBe("CM");
  });

  it("returns undefined for an unknown value", () => {
    expect(toIsoCountry("Wakanda")).toBeUndefined();
    expect(toIsoCountry(undefined)).toBeUndefined();
  });
});

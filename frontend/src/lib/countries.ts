import {
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";

/**
 * Country + dial-code helpers, backed by libphonenumber-js.
 *
 * Nothing here ships a country list of its own:
 *   - the ISO codes come from libphonenumber-js (`getCountries()`);
 *   - the display names come from the platform's `Intl.DisplayNames`, so they
 *     are ALREADY localized (fr → « Cameroun », en → "Cameroon") and cost
 *     zero bundle bytes — no translation keys to maintain per country;
 *   - the flags are derived from the ISO code (regional indicator symbols);
 *   - the expected national length comes from libphonenumber's own example
 *     number for the country (Cameroon → 9 digits).
 *
 * City lists are NOT here — they are fetched per country, see ./cities.ts.
 */

export type { CountryCode };

/** Every country libphonenumber-js can validate a number for. */
export const COUNTRY_CODES: readonly CountryCode[] = getCountries();

const isCountryCode = (value: string): value is CountryCode =>
  (COUNTRY_CODES as readonly string[]).includes(value);

/**
 * ISO 3166-1 alpha-2 → flag emoji, by mapping each letter to its regional
 * indicator symbol (A → 🇦). No image assets, no icon font.
 */
export function flagEmoji(isoCode: string): string {
  if (isoCode.length !== 2) return "";
  const A = 0x1f1e6;
  const a = "A".charCodeAt(0);
  return String.fromCodePoint(
    ...[...isoCode.toUpperCase()].map((char) => A + char.charCodeAt(0) - a),
  );
}

/** International dial code without the `+` (CM → "237"). */
export function dialCode(isoCode: CountryCode): string {
  return getCountryCallingCode(isoCode);
}

// `Intl.DisplayNames` construction is not free; one instance per language.
const displayNamesCache = new Map<string, Intl.DisplayNames | null>();

function displayNamesFor(lang: string): Intl.DisplayNames | null {
  const cached = displayNamesCache.get(lang);
  if (cached !== undefined) return cached;

  let instance: Intl.DisplayNames | null = null;
  try {
    instance = new Intl.DisplayNames([lang], { type: "region" });
  } catch {
    // Environment without full ICU data — fall back to raw ISO codes.
    instance = null;
  }
  displayNamesCache.set(lang, instance);
  return instance;
}

/** Localized country name ("CM" + "fr" → « Cameroun »); ISO code as fallback. */
export function countryName(isoCode: string, lang: string): string {
  try {
    return displayNamesFor(lang)?.of(isoCode) ?? isoCode;
  } catch {
    return isoCode;
  }
}

export interface CountryOption {
  /** ISO 3166-1 alpha-2 — the value stored in the form. */
  isoCode: CountryCode;
  /** Localized name for the current UI language. */
  name: string;
  /** Dial code without `+` ("237"). */
  dial: string;
  flag: string;
}

const optionsCache = new Map<string, CountryOption[]>();

/**
 * Every country, sorted by localized name so the list reads naturally in the
 * active language. Memoized per language (the sort is the expensive part).
 */
export function countryOptions(lang: string): CountryOption[] {
  const cached = optionsCache.get(lang);
  if (cached) return cached;

  const collator = new Intl.Collator(lang);
  const options = COUNTRY_CODES.map((isoCode) => ({
    isoCode,
    name: countryName(isoCode, lang),
    dial: dialCode(isoCode),
    flag: flagEmoji(isoCode),
  })).sort((a, b) => collator.compare(a.name, b.name));

  optionsCache.set(lang, options);
  return options;
}

/**
 * Countries sharing one dial code, in ISO order (+237 → ["CM"], +1 → ["AG",
 * "AI", "AS", "BB", … "US"]). Used to resolve a typed dial code to a country.
 */
const byDialCode = (() => {
  const map = new Map<string, CountryCode[]>();
  for (const isoCode of COUNTRY_CODES) {
    const dial = getCountryCallingCode(isoCode);
    const bucket = map.get(dial);
    if (bucket) bucket.push(isoCode);
    else map.set(dial, [isoCode]);
  }
  return map;
})();

/**
 * When several countries share a dial code, the one a user most likely means.
 * Only shared codes need an entry; everything else resolves unambiguously.
 */
const PRIMARY_FOR_DIAL: Record<string, CountryCode> = {
  "1": "US",
  "7": "RU",
  "44": "GB",
  "212": "MA",
  "262": "RE",
  "590": "GP",
  "596": "MQ",
  "599": "CW",
};

/**
 * Dial code → country ("237" → "CM"). `+` and spaces are tolerated.
 * Returns undefined when no country uses that code.
 */
export function countryFromDial(input: string): CountryCode | undefined {
  const dial = input.replace(/[^\d]/g, "");
  if (!dial) return undefined;

  const candidates = byDialCode.get(dial);
  if (!candidates || candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  return PRIMARY_FOR_DIAL[dial] ?? candidates[0];
}

/**
 * How many digits the national part of a number has in this country
 * (Cameroon → 9, France → 9, United States → 10), read from libphonenumber's
 * own example number. Undefined when the country has no example on file.
 */
export function expectedNationalLength(
  isoCode: CountryCode,
): number | undefined {
  try {
    return getExampleNumber(isoCode, examples)?.nationalNumber.length;
  } catch {
    return undefined;
  }
}

/** A realistic sample number to use as the input placeholder. */
export function examplePlaceholder(isoCode: CountryCode): string {
  try {
    return getExampleNumber(isoCode, examples)?.formatNational() ?? "";
  } catch {
    return "";
  }
}

/**
 * True when `national` is a valid number for `isoCode`. An empty value is
 * valid: phone numbers are optional in the backend contract, so emptiness is
 * the schema's business (`.optional()`), not this function's.
 */
export function isValidNationalNumber(
  national: string,
  isoCode: CountryCode,
): boolean {
  if (!national.trim()) return true;
  return parsePhoneNumberFromString(national, isoCode)?.isValid() ?? false;
}

/**
 * Compose the E.164 value the backend stores ("+237677889900").
 * Returns undefined for an empty national part, so optional fields stay
 * genuinely absent from the payload instead of being sent as "+237".
 */
export function toE164(
  national: string,
  isoCode: CountryCode,
): string | undefined {
  if (!national.trim()) return undefined;
  const parsed = parsePhoneNumberFromString(national, isoCode);
  return parsed?.isValid() ? parsed.number : `+${dialCode(isoCode)}${national}`;
}

/**
 * Split a stored E.164 number back into country + national part, so an edit
 * form can repopulate both controls. Falls back to the given default country.
 */
export function fromE164(
  value: string | undefined,
  fallback: CountryCode,
): { isoCode: CountryCode; national: string } {
  if (!value) return { isoCode: fallback, national: "" };

  const parsed = parsePhoneNumberFromString(value);
  if (parsed?.country && isCountryCode(parsed.country)) {
    return { isoCode: parsed.country, national: parsed.nationalNumber };
  }
  return { isoCode: fallback, national: value.replace(/^\+/, "") };
}

/** App default — the platform is operated from Cameroon. */
export const DEFAULT_COUNTRY: CountryCode = "CM";

/**
 * Seed a form from a stored record: resolve `pays` to an ISO code and split
 * the stored E.164 number into its national part.
 *
 * An unknown or absent country stays EMPTY rather than defaulting — the
 * phone control displays a default country without writing it, so opening an
 * edit dialog never stamps a country onto a record that has none.
 */
export function toLocationDefaults(
  country: string | undefined | null,
  phone: string | undefined | null,
): { country: string; phone: string } {
  const iso = toIsoCountry(country ?? undefined);
  const { national } = fromE164(phone ?? undefined, iso ?? DEFAULT_COUNTRY);
  return { country: iso ?? "", phone: national };
}

/**
 * Resolve whatever the backend stored in `pays` to an ISO code.
 *
 * New records store the ISO code ("CM") because it is stable across
 * languages, but rows created before the country picker existed hold free
 * text ("Cameroun", "Cameroon"). Matching the name in both UI languages means
 * editing such a record preselects the right country instead of blanking it.
 */
export function toIsoCountry(
  value: string | undefined,
): CountryCode | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  if (isCountryCode(upper)) return upper;

  const needle = trimmed.toLowerCase();
  for (const lang of ["fr", "en"]) {
    const match = COUNTRY_CODES.find(
      (isoCode) => countryName(isoCode, lang).toLowerCase() === needle,
    );
    if (match) return match;
  }
  return undefined;
}

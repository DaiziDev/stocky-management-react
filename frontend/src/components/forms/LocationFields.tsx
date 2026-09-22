import { useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { cn } from "@/lib/utils";
import { loadCities, peekCities } from "@/lib/cities";
import {
  COUNTRY_CODES,
  DEFAULT_COUNTRY,
  countryOptions,
  dialCode,
  examplePlaceholder,
  expectedNationalLength,
  flagEmoji,
  countryFromDial,
  type CountryCode,
} from "@/lib/countries";

/**
 * Location + phone fields shared by every address form.
 *
 * The three controls are bound to the SAME country field, which is what makes
 * them stay in sync: picking a country in `CountryField` immediately changes
 * the dial code shown by `PhoneField` and reloads `CityField`'s options, and
 * picking a dial code in `PhoneField` changes the selected country — there is
 * no duplicated state to reconcile, just one ISO code in the form.
 *
 * The country value stored in the form is an ISO 3166-1 alpha-2 code ("CM").
 */

const isCountryCode = (value: unknown): value is CountryCode =>
  typeof value === "string" &&
  (COUNTRY_CODES as readonly string[]).includes(value);

/** Shared label + error + helper chrome, matching the Input primitive. */
function FieldShell({
  id,
  label,
  required,
  error,
  helperText,
  children,
}: {
  id: string;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-content-secondary"
        >
          {label}
          {required && <span className="text-danger-500"> *</span>}
        </label>
      )}
      {children}
      {error && (
        <p
          className="mt-1.5 text-sm text-danger-600 dark:text-danger-500"
          role="alert"
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-content-muted">{helperText}</p>
      )}
    </div>
  );
}

const controlClasses = (error?: string) =>
  cn(
    "w-full rounded-sm border bg-surface px-3 py-2 text-content",
    "dark:bg-[color:var(--dark-input)] dark:text-[color:var(--dark-text-primary)]",
    "placeholder:text-content-disabled",
    "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
    "disabled:cursor-not-allowed disabled:bg-surface-secondary",
    error
      ? "border-danger-500 focus:ring-danger-500/20"
      : "border-border-strong dark:border-[color:var(--dark-border)]",
  );

/* ------------------------------------------------------------------ */
/* Country                                                             */
/* ------------------------------------------------------------------ */

interface CountryFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  control?: Control<T>;
  label?: string;
  required?: boolean;
  helperText?: string;
}

/**
 * Country picker — flag + localized name + dial code. Options are sorted by
 * the name in the active UI language, so the list reads correctly in fr & en.
 */
export function CountryField<T extends FieldValues>({
  name,
  control,
  label,
  required,
  helperText,
}: CountryFieldProps<T>) {
  const { t, i18n } = useTranslation("common");
  const id = useId();
  const { field, fieldState } = useController({ name, control });
  const options = useMemo(() => countryOptions(i18n.language), [i18n.language]);

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      error={fieldState.error?.message}
      helperText={helperText}
    >
      <select
        id={id}
        value={field.value ?? ""}
        onChange={(event) => field.onChange(event.target.value || undefined)}
        onBlur={field.onBlur}
        ref={field.ref}
        className={controlClasses(fieldState.error?.message)}
        aria-invalid={fieldState.error ? "true" : "false"}
      >
        <option value="">{t("location.countryPlaceholder")}</option>
        {options.map((option) => (
          <option key={option.isoCode} value={option.isoCode}>
            {option.flag} {option.name} (+{option.dial})
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/* ------------------------------------------------------------------ */
/* City                                                                */
/* ------------------------------------------------------------------ */

interface CityFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  /** Field holding the ISO country code that drives the city list. */
  countryFieldName: FieldPath<T>;
  control?: Control<T>;
  label?: string;
  required?: boolean;
}

/** How many suggestions to put in the DOM at once (datalists get slow). */
const MAX_SUGGESTIONS = 100;

/** Stable identity for "no cities yet" — a fresh [] would re-run the memo. */
const NO_CITIES: string[] = [];

/**
 * City picker driven by the selected country.
 *
 * Backed by a `<datalist>` rather than a `<select>`: the user can pick from
 * the country's real cities, but a city missing from the dataset can still be
 * typed by hand — the backend stores free text, so forcing a choice would be
 * stricter than the contract.
 */
export function CityField<T extends FieldValues>({
  name,
  countryFieldName,
  control,
  label,
  required,
}: CityFieldProps<T>) {
  const { t } = useTranslation("common");
  const id = useId();
  const listId = `${id}-cities`;

  const { field, fieldState } = useController({ name, control });
  const { field: countryField } = useController({
    name: countryFieldName,
    control,
  });

  const isoCode = isCountryCode(countryField.value)
    ? countryField.value
    : undefined;

  // Already-fetched countries resolve during render (the module-level cache
  // is synchronous), so state only ever holds the result of a fetch that this
  // component actually had to make — and is tagged with the country it is
  // for, which keeps a late response from landing on a different country.
  const [fetched, setFetched] = useState<{
    isoCode: string;
    list: string[];
  } | null>(null);

  const cached = isoCode ? peekCities(isoCode) : undefined;
  const resolved =
    cached ??
    (isoCode && fetched?.isoCode === isoCode ? fetched.list : undefined);
  const cities = resolved ?? NO_CITIES;
  const isLoading = !!isoCode && resolved === undefined;

  useEffect(() => {
    // Nothing to do without a country, or when the cache already has it.
    if (!isoCode || peekCities(isoCode)) return;

    let cancelled = false;
    loadCities(isoCode).then((list) => {
      if (!cancelled) setFetched({ isoCode, list });
    });

    return () => {
      cancelled = true;
    };
  }, [isoCode]);

  // Only surface the suggestions matching what has been typed, so the DOM
  // never holds thousands of <option> nodes (France alone has ~4 600 cities).
  const suggestions = useMemo(() => {
    const needle = String(field.value ?? "")
      .trim()
      .toLowerCase();
    const matching = needle
      ? cities.filter((city) => city.toLowerCase().includes(needle))
      : cities;
    return matching.slice(0, MAX_SUGGESTIONS);
  }, [cities, field.value]);

  const helperText = !isoCode
    ? t("location.cityPickCountryFirst")
    : isLoading
      ? t("location.cityLoading")
      : cities.length > 0
        ? t("location.cityCount", { count: cities.length })
        : undefined;

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      error={fieldState.error?.message}
      helperText={helperText}
    >
      <input
        id={id}
        list={listId}
        type="text"
        autoComplete="address-level2"
        value={field.value ?? ""}
        onChange={(event) => field.onChange(event.target.value)}
        onBlur={field.onBlur}
        ref={field.ref}
        placeholder={t("location.cityPlaceholder")}
        className={controlClasses(fieldState.error?.message)}
        aria-invalid={fieldState.error ? "true" : "false"}
      />
      <datalist id={listId}>
        {suggestions.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </FieldShell>
  );
}

/* ------------------------------------------------------------------ */
/* Phone                                                               */
/* ------------------------------------------------------------------ */

interface PhoneFieldProps<T extends FieldValues> {
  /** Field holding the national part of the number (digits only). */
  name: FieldPath<T>;
  /** Field holding the ISO country code — shared with Country/City fields. */
  countryFieldName: FieldPath<T>;
  control?: Control<T>;
  label?: string;
  required?: boolean;
}

/**
 * Phone input with a country selector.
 *
 * The selector shows the flag and the dial code (🇨🇲 +237) and writes to the
 * shared country field, so choosing a dial code here also fills the country
 * select — and vice versa. The helper line states how many digits the chosen
 * country expects, taken from libphonenumber's own example number.
 *
 * Pasting a full international number (`+237677889900`) is understood: the
 * country is detected from the prefix and the national part is kept.
 */
export function PhoneField<T extends FieldValues>({
  name,
  countryFieldName,
  control,
  label,
  required,
}: PhoneFieldProps<T>) {
  const { t, i18n } = useTranslation("common");
  const id = useId();

  const { field, fieldState } = useController({ name, control });
  const { field: countryField } = useController({
    name: countryFieldName,
    control,
  });

  const isoCode = isCountryCode(countryField.value)
    ? countryField.value
    : DEFAULT_COUNTRY;

  // The selector DISPLAYS a default country when none is set, but never
  // writes it: doing so would silently stamp a country onto an existing
  // record that simply has none, the moment its edit dialog is opened. The
  // schema and the write-mapper use the same "value or default" rule, so the
  // number is still validated and composed against what the user sees.
  const options = useMemo(() => countryOptions(i18n.language), [i18n.language]);

  const expected = expectedNationalLength(isoCode);
  const placeholder = examplePlaceholder(isoCode);

  /**
   * Typing `+…` means the user is pasting an international number: resolve
   * the dial code to a country and keep only the national digits.
   */
  const handleChange = (raw: string) => {
    if (raw.trim().startsWith("+")) {
      const digits = raw.replace(/[^\d]/g, "");
      // Dial codes are 1–3 digits; try the longest prefix first.
      for (const length of [3, 2, 1]) {
        const detected = countryFromDial(digits.slice(0, length));
        if (detected) {
          countryField.onChange(detected);
          field.onChange(digits.slice(length));
          return;
        }
      }
    }
    field.onChange(raw.replace(/[^\d\s-]/g, ""));
  };

  const helperText =
    expected !== undefined
      ? placeholder
        ? t("location.phoneExpected", { count: expected, example: placeholder })
        : t("location.phoneExpectedShort", { count: expected })
      : undefined;

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      error={fieldState.error?.message}
      helperText={helperText}
    >
      <div
        className={cn(
          "flex overflow-hidden rounded-sm border bg-surface",
          "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          "dark:bg-[color:var(--dark-input)]",
          fieldState.error
            ? "border-danger-500 focus-within:ring-danger-500/20"
            : "border-border-strong dark:border-[color:var(--dark-border)]",
        )}
      >
        <select
          aria-label={t("location.dialCode")}
          value={isoCode}
          onChange={(event) => countryField.onChange(event.target.value)}
          className="w-[7.25rem] shrink-0 border-0 border-r border-border-strong bg-transparent px-2.5 py-2 font-mono text-sm text-content outline-none dark:border-[color:var(--dark-border)] dark:text-[color:var(--dark-text-primary)]"
        >
          {options.map((option) => (
            <option key={option.isoCode} value={option.isoCode}>
              {option.flag} +{option.dial}
            </option>
          ))}
        </select>

        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={field.value ?? ""}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={field.onBlur}
          ref={field.ref}
          placeholder={placeholder}
          maxLength={expected ? expected + 6 : undefined}
          className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-content outline-none placeholder:text-content-disabled dark:text-[color:var(--dark-text-primary)]"
          aria-invalid={fieldState.error ? "true" : "false"}
        />
      </div>
    </FieldShell>
  );
}

/** Re-exported so forms can show the dial code outside a PhoneField. */
export { dialCode, flagEmoji };

import type { CountryCode } from "libphonenumber-js";

/**
 * City lists, fetched per country on demand.
 *
 * The data originates from `country-state-city`, but that package ships all
 * ~150 000 cities as a single 8 MB blob: importing it — even lazily — would
 * produce a multi-megabyte chunk for a select box. `scripts/gen-cities.mjs`
 * splits it into `public/data/cities/<ISO>.json` (Cameroon ≈ 1.4 KB) and this
 * module fetches the one file the selected country needs.
 *
 * Results are memoized for the page's lifetime, and in-flight requests are
 * shared so switching country back and forth never refetches.
 */

const cache = new Map<string, string[]>();
const inFlight = new Map<string, Promise<string[]>>();

/** Cities of a country, sorted; empty array when the country has no dataset. */
export function loadCities(isoCode: CountryCode): Promise<string[]> {
  const cached = cache.get(isoCode);
  if (cached) return Promise.resolve(cached);

  const pending = inFlight.get(isoCode);
  if (pending) return pending;

  const request = fetch(`/data/cities/${isoCode}.json`)
    .then((response) => (response.ok ? response.json() : []))
    .then((cities: unknown) => {
      const list = Array.isArray(cities) ? (cities as string[]) : [];
      cache.set(isoCode, list);
      return list;
    })
    .catch(() => {
      // Missing file or offline — the city field degrades to free text.
      cache.set(isoCode, []);
      return [];
    })
    .finally(() => {
      inFlight.delete(isoCode);
    });

  inFlight.set(isoCode, request);
  return request;
}

/** Synchronous peek for already-loaded countries (avoids a render flash). */
export function peekCities(isoCode: CountryCode): string[] | undefined {
  return cache.get(isoCode);
}

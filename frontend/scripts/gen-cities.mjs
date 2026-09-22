#!/usr/bin/env node
/**
 * Split `country-state-city`'s 8 MB city.json into one small file per country.
 *
 * The library is the source of truth, but its dataset ships as a single
 * 8 MB blob: importing it (even lazily) would produce a multi-megabyte chunk.
 * This script emits `public/data/cities/<ISO>.json` — a plain sorted array of
 * city names, ~10 KB for a country like Cameroon — which `src/lib/cities.ts`
 * fetches on demand when a country is selected.
 *
 * Output is generated, not committed (see .gitignore); it is rebuilt by the
 * `prepare`, `predev` and `prebuild` npm scripts so it always matches the
 * installed version of the library.
 */
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { City } from "country-state-city";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "data", "cities");

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

/** ISO alpha-2 → sorted, de-duplicated city names. */
const byCountry = new Map();
for (const city of City.getAllCities()) {
  const list = byCountry.get(city.countryCode);
  if (list) {
    list.add(city.name);
  } else {
    byCountry.set(city.countryCode, new Set([city.name]));
  }
}

let files = 0;
let bytes = 0;
for (const [isoCode, names] of byCountry) {
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  const payload = JSON.stringify(sorted);
  writeFileSync(join(outDir, `${isoCode}.json`), payload, "utf8");
  files += 1;
  bytes += Buffer.byteLength(payload);
}

const mb = (bytes / 1024 / 1024).toFixed(1);
console.log(
  `✅ cities: ${files} country files (${mb} MB total, served on demand) → public/data/cities/`,
);

import { describe, expect, it } from "vitest";
import { globalResources } from "./resources";

/**
 * i18n parity gate — fr and en must expose EXACTLY the same key paths in
 * every namespace, with no empty values (an empty string renders as nothing
 * at runtime). Covers:
 *   - the global `common` namespace (resources.ts, typed → a missing fr key
 *     would also break t() typing),
 *   - every feature namespace, imported through the same
 *     import.meta.glob the i18n bootstrap uses, so what is audited here is
 *     exactly what ships.
 */

type FlatMap = Map<string, unknown>;

function flatten(obj: unknown, prefix = "", out: FlatMap = new Map()): FlatMap {
  if (obj !== null && typeof obj === "object") {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (value !== null && typeof value === "object") {
        flatten(value, path, out);
      } else {
        out.set(path, value);
      }
    }
  }
  return out;
}

function parityFindings(name: string, fr: unknown, en: unknown): string[] {
  const frMap = flatten(fr);
  const enMap = flatten(en);
  const findings: string[] = [];

  for (const path of frMap.keys()) {
    if (!enMap.has(path)) findings.push(`[${name}] missing in EN: ${path}`);
  }
  for (const path of enMap.keys()) {
    if (!frMap.has(path)) findings.push(`[${name}] missing in FR: ${path}`);
  }
  for (const [path, value] of frMap) {
    if (enMap.has(path) && (value === "" || enMap.get(path) === "")) {
      findings.push(
        `[${name}] EMPTY value: ${path} (fr=${JSON.stringify(value)}, en=${JSON.stringify(enMap.get(path))})`,
      );
    }
  }
  return findings;
}

describe("i18n fr/en parity", () => {
  it("global common namespace: identical key sets, no empty values", () => {
    const findings = parityFindings(
      "common (global)",
      globalResources.fr,
      globalResources.en,
    );
    expect(findings).toEqual([]);
  });

  it("every feature namespace: identical key sets, no empty values", async () => {
    const modules = import.meta.glob<{ default: Record<string, unknown> }>(
      "../features/*/translations/*.json",
      { eager: true },
    );

    // Group by namespace: paths look like ../features/<ns>/translations/<lng>.json
    const ns = new Map<string, { fr?: unknown; en?: unknown }>();
    for (const [path, mod] of Object.entries(modules)) {
      const match = path.match(
        /features\/([^/]+)\/translations\/(fr|en)\.json$/,
      );
      if (!match) continue;
      const [, name, lng] = match as [string, string, "fr" | "en"];
      const entry = ns.get(name) ?? {};
      entry[lng] = mod.default;
      ns.set(name, entry);
    }

    expect(ns.size).toBeGreaterThan(10); // sanity: features actually discovered

    const allFindings: string[] = [];
    for (const [name, { fr, en }] of [...ns.entries()].sort()) {
      if (!fr || !en) {
        allFindings.push(
          `[${name}] missing FILE: ${!fr ? "fr.json" : ""}${!en ? "en.json" : ""}`,
        );
        continue;
      }
      allFindings.push(...parityFindings(name, fr, en));
    }

    expect(allFindings).toEqual([]);
  });
});

#!/usr/bin/env node
/**
 * Swagger coverage audit.
 *
 * Walks every operation in swagger.json and reports whether the frontend
 * actually calls it. An endpoint counts as consumed when some file under
 * `src/features/<x>/api/` issues an apiClient call whose URL resolves to that
 * path — matched through `API_ENDPOINTS` in src/lib/constants.ts, which is the
 * single source of backend paths.
 *
 * Run with `npm run audit:endpoints`. Exits non-zero when something in the
 * contract is never called, so the gap is visible instead of silent.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const swagger = JSON.parse(readFileSync(join(root, "swagger.json"), "utf8"));

/* ---- 1. every operation in the contract ------------------------------- */
const operations = [];
for (const [path, methods] of Object.entries(swagger.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    operations.push({
      path,
      method: method.toUpperCase(),
      tag: (op.tags || ["?"])[0],
      summary: op.summary || "",
      params: (op.parameters || []).map((p) => `${p.name}${p.required ? "*" : ""}`),
    });
  }
}

/* ---- 2. resolve API_ENDPOINTS to concrete path strings ---------------- */
const constantsFile = readFileSync(join(root, "src/lib/constants.ts"), "utf8");

/**
 * Only the API_ENDPOINTS object, not the whole file: several keys are defined
 * twice with different meanings (`USER` is an endpoint here and a localStorage
 * key in STORAGE_KEYS), so a file-wide lookup resolves to the wrong one.
 */
const start = constantsFile.indexOf("export const API_ENDPOINTS");
const end = constantsFile.indexOf("} as const;", start);
if (start === -1 || end === -1) {
  console.error("Could not locate the API_ENDPOINTS block in constants.ts");
  process.exit(2);
}
const constants = constantsFile.slice(start, end);

/* ---- 3. every apiClient call made by the app -------------------------- */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\./.test(entry)) out.push(full);
  }
  return out;
}

const sources = walk(join(root, "src"));
const calls = [];
for (const file of sources) {
  const text = readFileSync(file, "utf8");
  // Matches both `apiClient.get<T>(...)` in the feature modules and
  // `this.client.post<T>(...)` inside the axios wrapper (api/client.ts),
  // which is how the session-refresh and probe calls are issued.
  for (const m of text.matchAll(
    /\b(?:apiClient|this\.client)\s*\.\s*(get|post|put|patch|delete)\s*(?:<[^>]*>)?\s*\(/g,
  )) {
    calls.push({
      file: file.replace(root + "\\", "").replace(/\\/g, "/"),
      method: m[1].toUpperCase(),
      // The argument list can contain nested parens (`API_ENDPOINTS.USER(id)`),
      // so take a window after the paren and pull the constant out of it.
      window: text.slice(m.index + m[0].length, m.index + m[0].length + 200),
    });
  }
}

/* ---- 4. map each call expression back to a contract path -------------- */
const literalFor = (window) => {
  // Keys are not all upper-case (`DASHBOARD_KPIs`), so allow any identifier.
  const chain = window.match(/API_ENDPOINTS\.([A-Za-z_0-9.]+)/);
  if (!chain) return null;
  const key = chain[1].split(".").pop();
  // Find `KEY: "/path"` or `KEY: (id) => `/path/${id}``
  const str = constants.match(new RegExp(`\\b${key}\\s*:\\s*"([^"]+)"`));
  if (str) return str[1];
  const tpl = constants.match(
    new RegExp(`\\b${key}\\s*:\\s*\\([^)]*\\)\\s*=>\\s*\`([^\`]+)\``),
  );
  if (tpl) return tpl[1].replace(/\$\{[^}]+\}/g, "{id}");
  // Multi-line arrow bodies (prettier wraps long templates onto the next line)
  const wrapped = constants.match(
    new RegExp(`\\b${key}\\s*:\\s*\\([^)]*\\)\\s*=>\\s*\\n?\\s*\`([^\`]+)\``),
  );
  if (wrapped) return wrapped[1].replace(/\$\{[^}]+\}/g, "{id}");
  return null;
};

const consumed = new Set();
for (const call of calls) {
  const path = literalFor(call.window);
  if (path) consumed.add(`${call.method} /api${path}`);
}

/* ---- 5. report --------------------------------------------------------- */
const missing = [];
const byTag = new Map();
for (const op of operations) {
  const key = `${op.method} ${op.path}`;
  const isConsumed = consumed.has(key);
  if (!isConsumed) missing.push(op);
  const list = byTag.get(op.tag) || [];
  list.push({ ...op, consumed: isConsumed });
  byTag.set(op.tag, list);
}

console.log(`Swagger operations: ${operations.length}`);
console.log(`Consumed by the app: ${operations.length - missing.length}`);
console.log(`Never called:        ${missing.length}\n`);

for (const [tag, ops] of byTag) {
  console.log(`── ${tag}`);
  for (const op of ops) {
    const mark = op.consumed ? "✅" : "❌";
    const params = op.params.length ? `  [${op.params.join(", ")}]` : "";
    console.log(`   ${mark} ${op.method.padEnd(6)} ${op.path}${params}`);
    if (!op.consumed && op.summary) console.log(`        ${op.summary}`);
  }
  console.log();
}

if (missing.length) {
  console.log("❌ Endpoints in the contract that the frontend never calls:");
  for (const op of missing) console.log(`   ${op.method} ${op.path} — ${op.summary}`);
  process.exit(1);
}
console.log("✅ Every swagger operation is consumed.");

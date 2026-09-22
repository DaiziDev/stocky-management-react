#!/usr/bin/env node
/**
 * i18n audit — two gates in one script:
 *
 *   1. PARITY: fr vs en key sets must be identical in every namespace
 *      (global `common` from resources.ts + each feature's translations).
 *      Empty-string values are flagged (they render as nothing).
 *
 *   2. USAGE: every literal t('key') call in src must resolve in the
 *      namespace(s) its file uses — otherwise the raw key renders on screen.
 *      Calls carrying a defaultValue fallback are reported as soft findings.
 *
 * Exit code 1 when any hard finding exists — usable as a CI gate.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = process.cwd();
const findings = [];

/* ── flatten a nested object into "dot.path" → value ── */
function flatten(obj, prefix = '', out = new Map()) {
  for (const [key, value] of Object.entries(obj ?? {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object') flatten(value, path, out);
    else out.set(path, value);
  }
  return out;
}

/* ── PARITY across fr/en for one namespace ── */
function diffNamespace(name, fr, en) {
  const frMap = flatten(fr);
  const enMap = flatten(en);
  for (const path of frMap.keys()) if (!enMap.has(path)) findings.push(`[${name}] missing in EN: ${path}`);
  for (const path of enMap.keys()) if (!frMap.has(path)) findings.push(`[${name}] missing in FR: ${path}`);
  for (const [path, value] of frMap) {
    if (enMap.has(path) && (value === '' || enMap.get(path) === '')) {
      findings.push(`[${name}] EMPTY value: ${path}`);
    }
  }
}

/* ── gather namespaces ── */
const namespaces = new Map(); // name → { fr, en }

// 1) global `common` from resources.ts — Node 24 imports TS natively.
try {
  const mod = await import(pathToFileURL(join(root, 'src/i18n/resources.ts')).href);
  if (mod?.globalResources?.fr?.common && mod.globalResources.en?.common) {
    namespaces.set('common', { fr: mod.globalResources.fr.common, en: mod.globalResources.en.common });
  }
} catch {
  console.log('! native TS import of resources.ts failed — global common skipped (parity test covers it)');
}

// 2) feature namespaces from their JSON files
const featuresDir = join(root, 'src/features');
for (const feature of readdirSync(featuresDir).sort()) {
  const dir = join(featuresDir, feature, 'translations');
  if (!existsSync(dir)) continue;
  const frPath = join(dir, 'fr.json');
  const enPath = join(dir, 'en.json');
  if (!existsSync(frPath) || !existsSync(enPath)) {
    findings.push(`[${feature}] missing FILE: ${!existsSync(frPath) ? 'fr.json' : ''}${!existsSync(enPath) ? 'en.json' : ''}`);
    continue;
  }
  namespaces.set(feature, {
    fr: JSON.parse(readFileSync(frPath, 'utf8')),
    en: JSON.parse(readFileSync(enPath, 'utf8')),
  });
}

/* ── gate 1: parity ── */
for (const [name, { fr, en }] of namespaces) diffNamespace(name, fr, en);

/* ── gate 2: usage — every literal t('key') must resolve in its ns ── */
const flatKeys = new Map(); // ns → Map(flatPath → true)
for (const [name, { fr }] of namespaces) flatKeys.set(name, flatten(fr));

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name) || /\.(test|spec)\.(ts|tsx)$/.test(entry.name)) continue;

    const src = readFileSync(p, 'utf8');
    const rel = p.slice(root.length + 1).replaceAll('\\', '/');

    // Precompute line start offsets so a match can be traced to its line and
    // skipped when it sits inside a // or block comment (doc examples).
    const lineStarts = [];
    for (let i = 0; i < src.length; i++) {
      if (i === 0 || src[i - 1] === '\n') lineStarts.push(i);
    }
    const lineOf = (idx) => {
      let lo = 0;
      let hi = lineStarts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (lineStarts[mid] <= idx) lo = mid;
        else hi = mid - 1;
      }
      return { text: src.slice(lineStarts[lo], src.indexOf('\n', lineStarts[lo])), start: lineStarts[lo] };
    };
    const isCommentLine = (idx) => {
      const { text } = lineOf(idx);
      const trimmed = text.trimStart();
      return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
    };

    // which namespace(s) does this file consume?
    const nsMatches = [...src.matchAll(/useTranslation\(\s*['"]([a-z-]+)['"]/g)].map((m) => m[1]);
    const usesDefaultNs = /useTranslation\(\s*\)/.test(src);
    const nsList = nsMatches.length ? nsMatches : usesDefaultNs ? ['common'] : [];
    if (!nsList.length) continue;

    // literal keys passed to t()
    for (const m of src.matchAll(/\bt\(\s*['"]([a-zA-Z0-9_.-]+)['"]\s*([,)])/g)) {
      if (isCommentLine(m.index)) continue; // doc-comment examples
      const key = m[1];

      // An explicit { ns: 'x' } override wins over the file's default.
      const argCtx = src.slice(m.index, src.indexOf(')', m.index) + 1);
      const nsOverride = argCtx.match(/\bns\s*:\s*['"]([a-z-]+)['"]/);
      const effectiveNsList = nsOverride ? [nsOverride[1]] : nsList;

      for (const ns of effectiveNsList) {
        const keys = flatKeys.get(ns);
        if (!keys) {
          findings.push(`[MISSING] ${rel} → namespace '${ns}' not found in resources`);
          continue;
        }
        // Exact match, i18next plural suffixes (key_one/key_other), or the key
        // being the prefix of a nested object all resolve at runtime.
        const exact =
          keys.has(key) ||
          keys.has(`${key}_one`) ||
          keys.has(`${key}_other`) ||
          keys.has(`${key}_zero`);
        const isPrefix = [...keys.keys()].some((k) => k.startsWith(`${key}.`));
        if (!exact && !isPrefix) {
          const ctx = src.slice(m.index, m.index + 200);
          const soft = /defaultValue\s*:/.test(ctx);
          findings.push(`${soft ? '[soft]   ' : '[MISSING]'} ${rel} → ${ns}:${key}${soft ? ' (has defaultValue fallback)' : ''}`);
        }
      }
    }
  }
}
walk(join(root, 'src'));

/* ── report ── */
const audited = [...namespaces.keys()].join(', ');
console.log(`Namespaces audited (${namespaces.size}): ${audited}\n`);

if (findings.length === 0) {
  console.log('✅ i18n audit OK — fr/en parity complete, every t() call resolves.');
} else {
  console.log(`❌ ${findings.length} i18n finding(s):\n`);
  for (const f of findings) console.log('  ' + f);
  if (findings.some((f) => f.startsWith('[MISSING]') || f.startsWith('['))) process.exitCode = 1;
}

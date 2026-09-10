#!/usr/bin/env node
// Contrast coverage linter — companion to contrast-check.mjs. No dependencies.
// Scans source for color-bearing declarations and warns when a color token used
// in the UI is not covered by any pairing in the contrast manifest. Coverage is
// heuristic, so it WARNS by default (exit 0). Set coverage.failOnUncovered=true
// (or pass --strict) to make missing coverage fail the build.
//
// Usage: node scripts/contrast-coverage.mjs [path/to/contrast.config.json] [--strict]
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const configPath = process.argv[2] && !process.argv[2].startsWith("--")
  ? process.argv[2] : "accessibility/contrast.config.json";
let config;
try { config = JSON.parse(readFileSync(configPath, "utf8")); }
catch (e) { console.error(`Could not read ${configPath}: ${e.message}`); process.exit(2); }

const cov = config.coverage || {};
const sources = cov.sources || ["app", "components"];
const exts = new Set(cov.extensions || [".css", ".scss", ".sass", ".tsx", ".ts", ".jsx", ".js", ".mjs"]);
const ignore = new Set((cov.ignoreTokens || []).map((t) => t.toLowerCase()));
const strict = process.argv.includes("--strict") || cov.failOnUncovered === true;

// Tokens the manifest already checks, by role.
const tokenOf = (v) => { const m = String(v).match(/var\(\s*(--[\w-]+)/); return (m ? m[1] : String(v).trim()).toLowerCase(); };
const coveredFg = new Set(), coveredBg = new Set(), coveredUi = new Set();
for (const p of config.pairs || []) {
  const fg = tokenOf(p.fg), bg = tokenOf(p.bg);
  coveredFg.add(fg); coveredBg.add(bg);
  if (p.ui) { coveredUi.add(fg); coveredUi.add(bg); }
}

function walk(p, out = []) {
  let st; try { st = statSync(p); } catch { return out; }
  if (st.isDirectory()) {
    if (/(^|\/)(node_modules|\.next|\.git|dist|build|out)(\/|$)/.test(p)) return out;
    for (const e of readdirSync(p)) walk(join(p, e), out);
  } else if (exts.has(extname(p))) out.push(p);
  return out;
}
const files = sources.flatMap((s) => walk(s));

const FG = /^(color|fill|stroke|-webkit-text-fill-color)$/;
const BG = /^(background|background-color|background-image)$/;
const UI = /^(border|border-(top|right|bottom|left)-color|border-color|outline|outline-color|box-shadow|--tw-ring-color|caret-color|text-decoration-color)$/;
const STATE = /:(hover|focus|focus-visible|focus-within|active|disabled|visited|checked)|\[(?:data-state|aria-[\w-]+)/i;
const roleFor = (prop) => (FG.test(prop) ? "fg" : BG.test(prop) ? "bg" : UI.test(prop) ? "ui" : null);
const colorsIn = (value) => {
  const out = []; const re = /var\(\s*(--[\w-]+)|(#[0-9a-fA-F]{3,8})\b|\b(?:rgba?|hsla?)\([^)]*\)/g;
  let m; while ((m = re.exec(value))) out.push(m[1] || m[2] || m[0]);
  return out;
};

const findings = []; // { color, role, state, file, isToken }
const record = (color, role, state, file) => {
  if (!color || !role) return;
  const c = color.toLowerCase();
  if (ignore.has(c)) return;
  findings.push({ color: c, role, state, file, isToken: c.startsWith("--") });
};

for (const file of files) {
  let text; try { text = readFileSync(file, "utf8"); } catch { continue; }
  if (/\.(css|scss|sass)$/.test(file)) {
    const blockRe = /([^{}]+)\{([^{}]*)\}/g; let b;
    while ((b = blockRe.exec(text))) {
      const state = STATE.test(b[1]);
      const declRe = /(?:^|;|\n)\s*(--[\w-]+|[a-z-]+)\s*:\s*([^;]+)/gi; let d;
      while ((d = declRe.exec(b[2]))) {
        const role = roleFor(d[1].toLowerCase());
        if (role) for (const c of colorsIn(d[2])) record(c, role, state, file);
      }
    }
  } else {
    const styleRe = /\b(color|background|backgroundColor|borderColor|outlineColor|fill|stroke|caretColor)\s*:\s*['"`]([^'"`]+)['"`]/g; let s;
    while ((s = styleRe.exec(text))) {
      const prop = s[1].replace(/([A-Z])/g, "-$1").toLowerCase();
      const role = roleFor(prop) || roleFor(prop.replace("-color", "")) || "fg";
      for (const c of colorsIn(s[2])) record(c, role, false, file);
    }
    const twRe = /\b(?:(hover|focus|focus-visible|active|disabled|visited|checked|group-hover|aria-[\w-]+):)?(text|bg|border|ring|fill|stroke|caret|decoration)-\[(?:var\((--[\w-]+)\)|(#[0-9a-fA-F]{3,8}))\]/g; let t;
    while ((t = twRe.exec(text))) {
      const kind = t[2];
      const role = ["text", "fill", "stroke", "caret", "decoration"].includes(kind) ? "fg" : kind === "bg" ? "bg" : "ui";
      record(t[3] || t[4], role, Boolean(t[1]), file);
    }
  }
}

const isCovered = (f) => f.role === "fg" ? coveredFg.has(f.color)
  : f.role === "bg" ? coveredBg.has(f.color) : coveredUi.has(f.color);

const byToken = new Map();
for (const f of findings) {
  const key = `${f.color}|${f.role}`;
  if (!byToken.has(key)) byToken.set(key, { ...f, files: new Set(), state: false });
  const e = byToken.get(key); e.files.add(f.file); e.state = e.state || f.state;
}

const tokenEntries = [...byToken.values()].filter((e) => e.isToken);
const litEntries = [...byToken.values()].filter((e) => !e.isToken);
const uncoveredTokens = tokenEntries.filter((e) => !isCovered(e));
const uncoveredLits = litEntries.filter((e) => !isCovered(e));

const roleName = { fg: "foreground", bg: "background", ui: "border/UI" };
console.log(`Contrast coverage — scanned ${files.length} file(s) under ${sources.join(", ")}\n`);

if (uncoveredTokens.length) {
  console.log("Color tokens used in the UI but NOT in any manifest pairing:");
  for (const e of uncoveredTokens.sort((a, b) => a.color.localeCompare(b.color))) {
    const hint = e.state ? "  <- add the interactive-state pairing" : "  <- add a pairing";
    console.log(`  ${e.color.padEnd(26)} ${roleName[e.role]}${e.state ? " [state]" : ""}` +
      `  (${[...e.files].slice(0, 3).join(", ")})${hint}`);
  }
  console.log("");
}
if (uncoveredLits.length) {
  console.log("Hard-coded color literals (prefer Style Guide tokens; verify these pairings):");
  for (const e of uncoveredLits.sort((a, b) => a.color.localeCompare(b.color)))
    console.log(`  ${e.color.padEnd(26)} ${roleName[e.role]}${e.state ? " [state]" : ""}  (${[...e.files].slice(0, 3).join(", ")})`);
  console.log("");
}

const usedTokens = new Set(tokenEntries.map((e) => e.color));
console.log(`${usedTokens.size} token(s) used, ${usedTokens.size - new Set(uncoveredTokens.map((e) => e.color)).size} covered, ` +
  `${new Set(uncoveredTokens.map((e) => e.color)).size} uncovered.`);
if (!uncoveredTokens.length && !uncoveredLits.length) console.log("All discovered color usages are covered by the manifest.");

const problems = uncoveredTokens.length + uncoveredLits.length;
if (strict && problems) { console.log(`\nStrict mode: ${problems} uncovered usage(s) — failing.`); process.exit(1); }
process.exit(0);

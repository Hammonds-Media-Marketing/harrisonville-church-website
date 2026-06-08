#!/usr/bin/env node
// WCAG 2.x color-contrast build gate. No dependencies.
// Usage: node scripts/contrast-check.mjs [path/to/contrast.config.json]
// Exits non-zero if any pairing fails its AA target (or cannot be resolved),
// so it blocks `next build` (via prebuild) and fails CI.
import { readFileSync } from "node:fs";

const NAMED = {
  black: "#000000", white: "#ffffff", red: "#ff0000", green: "#008000",
  blue: "#0000ff", gray: "#808080", grey: "#808080", silver: "#c0c0c0",
  transparent: "rgba(0,0,0,0)",
  // add any brand keyword you actually use
};

function parseColor(input) {
  let s = String(input).trim().toLowerCase();
  if (NAMED[s]) s = NAMED[s];
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16),
          b = parseInt(h.slice(4, 6), 16), a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return [r, g, b, a];
  }
  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) { const p = m[1].split(/[,/\s]+/).filter(Boolean); return [+p[0], +p[1], +p[2], p[3] === undefined ? 1 : +p[3]]; }
  m = s.match(/^hsla?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[,/\s]+/).filter(Boolean);
    let h = ((+p[0] % 360) + 360) % 360, sat = parseFloat(p[1]) / 100, l = parseFloat(p[2]) / 100,
        a = p[3] === undefined ? 1 : p[3].endsWith("%") ? parseFloat(p[3]) / 100 : +p[3];
    const c = (1 - Math.abs(2 * l - 1)) * sat, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), mm = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
    return [Math.round((r + mm) * 255), Math.round((g + mm) * 255), Math.round((b + mm) * 255), a];
  }
  throw new Error(`cannot parse color "${input}"`);
}

// Pull `--name: value;` declarations from CSS text (last declaration wins).
function extractCssVars(text) {
  const vars = {};
  const re = /(--[\w-]+)\s*:\s*([^;}]+?)\s*[;}]/g;
  let m;
  while ((m = re.exec(text))) vars[m[1].trim()] = m[2].trim();
  return vars;
}

// Resolve a value that may be `var(--x[, fallback])` against the token map.
function resolveValue(value, tokens, seen = new Set()) {
  const v = String(value).trim();
  const m = v.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/i);
  if (!m) return v;
  const name = m[1], fallback = m[2];
  if (seen.has(name)) throw new Error(`var() cycle at ${name}`);
  if (tokens[name] === undefined) {
    if (fallback !== undefined) return resolveValue(fallback, tokens, new Set(seen));
    throw new Error(`unknown CSS variable ${name} (not in tokens or cssFiles)`);
  }
  return resolveValue(tokens[name], tokens, new Set(seen).add(name));
}

function over(fg, bg) {
  const [fr, fgc, fb, fa] = fg, [br, bgc, bb] = bg;
  return [Math.round(fr * fa + br * (1 - fa)), Math.round(fgc * fa + bgc * (1 - fa)), Math.round(fb * fa + bb * (1 - fa)), 1];
}
function lum([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratioOf(fg, bg) {
  const L1 = lum(fg), L2 = lum(bg), [hi, lo] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

const configPath = process.argv[2] || "accessibility/contrast.config.json";
let config;
try { config = JSON.parse(readFileSync(configPath, "utf8")); }
catch (e) { console.error(`Could not read contrast config at ${configPath}: ${e.message}`); process.exit(2); }

const tokens = {};
for (const file of config.cssFiles || []) {
  try { Object.assign(tokens, extractCssVars(readFileSync(file, "utf8"))); }
  catch (e) { console.error(`Could not read cssFile ${file}: ${e.message}`); process.exit(2); }
}
Object.assign(tokens, config.tokens || {}); // inline overrides win

let failures = 0;
console.log(`Contrast gate — ${(config.pairs || []).length} pairing(s) from ${configPath}\n`);
for (const p of config.pairs || []) {
  let r, resolvedFg, resolvedBg;
  try {
    resolvedFg = resolveValue(p.fg, tokens);
    resolvedBg = resolveValue(p.bg, tokens);
    let fg = parseColor(resolvedFg);
    const bg = parseColor(resolvedBg); bg[3] = 1;
    if (fg[3] < 1) fg = over(fg, bg);
    r = ratioOf(fg, bg);
  } catch (e) {
    failures++;
    console.log(`✗ ${(p.name || "(unnamed)").padEnd(28)} ERROR: ${e.message}`);
    continue;
  }
  const need = p.ui ? 3 : p.large ? 3 : 4.5;
  const needAAA = p.ui ? 3 : p.large ? 4.5 : 7;
  const pass = r >= need;
  if (!pass) failures++;
  const mark = pass ? "✓" : "✗";
  const aaa = r >= needAAA ? " AAA✓" : "";
  const invisible = r < 1.2 ? "  <-- INVISIBLE / same resolved color" : "";
  console.log(
    `${mark} ${(p.name || "(unnamed)").padEnd(28)} ${r.toFixed(2)}:1  need ${need}:1${aaa}` +
    `   [${resolvedFg} on ${resolvedBg}]${invisible}`
  );
}
console.log(`\n${failures} failure(s).`);
process.exit(failures ? 1 : 0);

#!/usr/bin/env node
// token-drift-lint — guards the "Style Guide is the single source of truth" rule:
// every color/typography value should consume a CSS variable, so one token edit
// restyles the whole build. Flags hard-coded hex colors and raw px font-sizes in
// component/page CSS, skipping the token-definition files themselves
// (styleguide.css / globals.css) where the tokens legitimately live. Soft gate.
// Complements contrast-coverage.mjs (which checks color *pairings*); this checks
// *drift away from tokens* broadly.
import { join, basename } from "node:path";
import { walk, read, result, runStandalone, REPO_ROOT } from "./lib.mjs";

const TOKEN_FILES = new Set(["styleguide.css", "globals.css", "tokens.css", "theme.css"]);

export function run(ctx) {
  const { config } = ctx;
  const sev = config.severity["token-drift"];
  const findings = [];
  const dirs = ["site", "app", "components", "src"].map((d) => join(REPO_ROOT, d));
  let files = ctx.changed
    ? ctx.changed.filter((f) => f.endsWith(".css"))
    : dirs.flatMap((d) => walk(d, [".css"], config.ignoreDirs));
  if (!files.length) return result("token-drift", sev, [], { skipped: true, note: "no CSS to scan yet" });

  for (const file of files) {
    const abs = file.startsWith("/") ? file : join(REPO_ROOT, file);
    if (TOKEN_FILES.has(basename(abs))) continue; // tokens are defined here — expected
    const rel = abs.replace(REPO_ROOT + "/", "");
    let text;
    try { text = read(abs); } catch { continue; }
    const seen = new Set();
    // Hard-coded hex in a color-bearing declaration (not inside a var() definition).
    for (const m of text.matchAll(/(color|background|background-color|border[\w-]*|fill|stroke|box-shadow|outline)\s*:\s*([^;{}]*#[0-9a-fA-F]{3,8}[^;{}]*)/gi)) {
      const key = `hex:${m[1]}:${m[2].trim()}`;
      if (seen.has(key)) continue; seen.add(key);
      findings.push({ level: "warn", msg: `hard-coded color in "${m[1]}" — use a Style Guide token: ${m[2].trim()}`, file: rel });
    }
    for (const m of text.matchAll(/font-size\s*:\s*(\d*\.?\d+px)/gi)) {
      const key = `fs:${m[1]}`;
      if (seen.has(key)) continue; seen.add(key);
      findings.push({ level: "warn", msg: `raw px font-size ${m[1]} — use a typographic-scale token`, file: rel });
    }
  }
  return result("token-drift", sev, findings);
}

if (import.meta.url === `file://${process.argv[1]}`) runStandalone(run);

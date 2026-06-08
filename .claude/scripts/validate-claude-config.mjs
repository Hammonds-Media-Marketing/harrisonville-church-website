#!/usr/bin/env node
// Integrity gate for the .claude workflow. No dependencies.
// Catches the *silent* failure class: a CLAUDE.md @-import or a skill that
// points at a file that does not exist, so a broken reference is surfaced
// before any build work runs (via the SessionStart hook) and on every PR
// (via CI) instead of failing quietly mid-build.
//
// Checks:
//   1. Every @-import and every `.claude/...` file path in CLAUDE.md resolves.
//   2. Every `references/<file>`, `assets/<file>`, and `templates/<file>`
//      mentioned in a skill's SKILL.md exists relative to that skill's directory.
//   3. Every directory under .claude/skills/ contains a SKILL.md.
//
// Usage: node validate-claude-config.mjs [repoRoot] [--verbose]
// Exits 1 if any reference is broken, 0 if clean.
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const rootArg = args.find((a) => !a.startsWith("--"));
const here = dirname(fileURLToPath(import.meta.url)); // .claude/scripts
const repoRoot = resolve(rootArg || join(here, "..", ".."));
const claudeMd = join(repoRoot, ".claude", "CLAUDE.md");
const skillsDir = join(repoRoot, ".claude", "skills");

const results = []; // { ok, label, detail }
const record = (ok, label, detail = "") => results.push({ ok, label, detail });
const isFile = (p) => existsSync(p) && statSync(p).isFile();
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
const trimTrailingPunct = (s) => s.replace(/[.,:;)\]]+$/, "");

// --- Check 1: CLAUDE.md references -----------------------------------------
if (!isFile(claudeMd)) {
  record(false, "CLAUDE.md present", claudeMd);
} else {
  const text = readFileSync(claudeMd, "utf8");
  const candidates = new Map(); // repo-relative path -> source label

  // @-imports — an @ followed by a path token that contains a slash
  // (so contact emails like hello@hmm.agency are ignored).
  for (const m of text.matchAll(/@([A-Za-z0-9._][A-Za-z0-9._/-]*\/[A-Za-z0-9._/-]+)/g)) {
    candidates.set(trimTrailingPunct(m[1]), "@-import");
  }
  // Inline `.claude/...` file references (backticked or plain) with a known
  // extension — catches e.g. the trigger-loaded skill path and this script.
  for (const m of text.matchAll(/\.claude\/[A-Za-z0-9._/-]+\.(?:json|jsonc|mjs|cjs|ya?ml|tsx?|css|md|js)(?![A-Za-z0-9])/g)) {
    candidates.set(trimTrailingPunct(m[0]), "reference");
  }

  for (const [rel, source] of candidates) {
    record(isFile(resolve(repoRoot, rel)), `CLAUDE.md ${source}`, rel);
  }
}

// --- Checks 2 & 3: per-skill SKILL.md and its bundled references ------------
if (!isDir(skillsDir)) {
  record(false, "skills directory present", skillsDir);
} else {
  for (const entry of readdirSync(skillsDir)) {
    const skillPath = join(skillsDir, entry);
    if (!isDir(skillPath)) continue; // skip stray loose files
    const skillMd = join(skillPath, "SKILL.md");
    if (!isFile(skillMd)) {
      record(false, `skill ${entry}`, "missing SKILL.md");
      continue;
    }
    const body = readFileSync(skillMd, "utf8");
    const seen = new Set();
    for (const m of body.matchAll(/(?:references|assets|templates)\/[A-Za-z0-9._/-]+/g)) {
      const token = trimTrailingPunct(m[0]);
      if (seen.has(token)) continue;
      seen.add(token);
      const target = join(skillPath, token);
      const ok = token.endsWith("/") ? isDir(target) : isFile(target);
      record(ok, `${entry}`, token);
    }
  }
}

// --- Check 4: bot-policy single-source invariant ---------------------------
// The stack docs must reference .claude/references/bot-policy.md and must NOT
// re-inline the training-scraper list (that duplication is what drifts).
const botPolicy = join(repoRoot, ".claude", "references", "bot-policy.md");
record(isFile(botPolicy), "bot-policy.md present", ".claude/references/bot-policy.md");
for (const doc of ["build-stacks/nextjs.md", "build-stacks/static-html.md"]) {
  const p = join(repoRoot, ".claude", doc);
  if (!isFile(p)) { record(false, `stack doc ${doc}`, "missing"); continue; }
  const body = readFileSync(p, "utf8");
  record(body.includes("references/bot-policy.md"), `${doc} links bot-policy`, "must reference the single source of truth");
  const inlinesList = /GPTBot/.test(body) && /Bytespider/.test(body) && /CCBot/.test(body);
  record(!inlinesList, `${doc} no inline bot list`, "bot names belong only in bot-policy.md");
}

// --- Report ----------------------------------------------------------------
const failures = results.filter((r) => !r.ok);
console.log(`Claude config validation — ${repoRoot}`);
console.log(`${results.length} reference(s) checked.\n`);

for (const r of results) {
  if (r.ok && !verbose) continue;
  const mark = r.ok ? "✓" : "✗";
  console.log(`${mark} ${r.label}${r.detail ? `  ${r.detail}` : ""}`);
}

if (failures.length) {
  console.log(`\n${failures.length} broken reference(s).`);
  process.exit(1);
}
console.log("All references resolve.");
process.exit(0);

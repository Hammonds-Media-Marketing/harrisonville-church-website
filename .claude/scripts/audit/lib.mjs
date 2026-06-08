// Shared helpers for the .claude/scripts/audit suite. No dependencies.
// Every linter imports from here and exports a `run(ctx)` returning a Result, so
// the orchestrator (verify-build.mjs) can call them in-process, and each is also
// runnable standalone from the CLI.
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, extname, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const AUDIT_DIR = dirname(fileURLToPath(import.meta.url)); // .claude/scripts/audit
export const REPO_ROOT = resolve(AUDIT_DIR, "..", "..", "..");

export function loadConfig() {
  const p = join(AUDIT_DIR, "audit.config.json");
  return JSON.parse(readFileSync(p, "utf8"));
}

export const isFile = (p) => existsSync(p) && statSync(p).isFile();
export const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
export const read = (p) => readFileSync(p, "utf8");

// Detect which stack a build at `root` is. Returns "next" | "static" | null.
export function detectStack(root = REPO_ROOT) {
  if (isFile(join(root, "package.json"))) {
    try {
      const pkg = JSON.parse(read(join(root, "package.json")));
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (deps.next || isDir(join(root, "app")) || isDir(join(root, "pages"))) return "next";
    } catch { /* fall through */ }
  }
  if (isDir(join(root, "site"))) return "static";
  if (isDir(join(root, "app"))) return "next";
  return null;
}

// Recursively collect files under `dir` whose extension is in `exts`.
export function walk(dir, exts, ignoreDirs = [], out = []) {
  if (!isDir(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (ignoreDirs.includes(entry)) continue;
    const p = join(dir, entry);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, exts, ignoreDirs, out);
    else if (exts.includes(extname(p))) out.push(p);
  }
  return out;
}

// Strip <script>/<style> blocks and tags to get visible-ish text from HTML.
export function htmlToText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// A Result is what every linter returns and the orchestrator aggregates.
//   { gate, severity, ok, findings: [{ level:"error"|"warn", msg, file? }], skipped? }
export function result(gate, severity, findings, { skipped = false, note = "" } = {}) {
  const errors = findings.filter((f) => f.level === "error");
  return {
    gate,
    severity,
    findings,
    skipped,
    note,
    // A hard gate is "ok" only with zero errors; a soft gate is always non-blocking.
    ok: skipped || severity !== "hard" ? true : errors.length === 0,
    blocking: !skipped && severity === "hard" && errors.length > 0,
  };
}

// Pretty-print a single Result to the console.
export function printResult(r) {
  const mark = r.skipped ? "○" : r.blocking ? "✗" : r.findings.length ? "⚠" : "✓";
  const sev = r.severity === "hard" ? "hard" : "soft";
  console.log(`${mark} ${r.gate.padEnd(20)} [${sev}]  ${r.skipped ? `skipped — ${r.note}` : `${r.findings.length} finding(s)`}`);
  for (const f of r.findings) {
    const tag = f.level === "error" ? "  ✗" : "  ·";
    console.log(`${tag} ${f.msg}${f.file ? `  (${f.file})` : ""}`);
  }
}

// Standalone CLI runner: call a linter's run() and exit non-zero only if it blocks.
export function runStandalone(runFn) {
  const ctx = { root: REPO_ROOT, config: loadConfig(), stack: detectStack(), changed: null, strict: process.argv.includes("--strict") };
  const r = runFn(ctx);
  printResult(r);
  process.exit(r.blocking || (ctx.strict && r.findings.length) ? 1 : 0);
}

#!/usr/bin/env node
// verify-build — orchestrator for the HMM dev-loop audit suite. Detects the
// stack, runs every applicable gate, prints one aggregated report, and exits
// non-zero only if a HARD gate is blocking. Single entrypoint for:
//   · the /build-audit command and manual runs   (default)
//   · the Stop hook        (--hook-stop)          → blocks the turn until clean
//   · the PostToolUse hook (--hook-posttooluse)   → advisory feedback per edit
//   · Next.js prebuild and CI                     (default / --advisory)
//
// Flags:
//   --advisory   downgrade every hard gate to soft (nothing blocks)
//   --strict     treat any finding (soft included) as blocking
//   --changed a,b,c   only scan these files (fast path; advisory by nature)
//   --json       print machine-readable JSON summary
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { loadConfig, detectStack, isFile, isDir, printResult, result, REPO_ROOT } from "./lib.mjs";
import { run as copyLint } from "./copy-lint.mjs";
import { run as seoMeta } from "./seo-meta-lint.mjs";
import { run as schemaLint, runInjection as schemaInjection } from "./schema-lint.mjs";
import { run as servedDom } from "./served-dom-check.mjs";
import { run as robotsPolicy } from "./robots-policy-lint.mjs";
import { run as tokenDrift } from "./token-drift-lint.mjs";

const CONTRAST_CHECK = join(REPO_ROOT, ".claude/skills/web-accessibility/assets/contrast-check.mjs");
const CONTRAST_COVERAGE = join(REPO_ROOT, ".claude/skills/web-accessibility/assets/contrast-coverage.mjs");
const CONFIG_VALIDATOR = join(REPO_ROOT, ".claude/scripts/validate-claude-config.mjs");
const CONTRAST_MANIFEST = join(REPO_ROOT, "accessibility/contrast.config.json");

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valOf = (f) => { const a = argv.find((x) => x.startsWith(f + "=")); return a ? a.slice(f.length + 1) : null; };

// Run a child script; return a Result. severity from config.
function runChild(gate, severity, script, args = []) {
  try {
    const out = execFileSync("node", [script, ...args], { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return result(gate, severity, [], { note: out.trim().split("\n").slice(-1)[0] || "" });
  } catch (e) {
    const tail = String(e.stdout || e.stderr || e.message).trim().split("\n").slice(-3).join(" / ");
    return result(gate, severity, [{ level: severity === "hard" ? "error" : "warn", msg: tail }]);
  }
}

function gather(ctx) {
  const results = [];
  // 1. Config integrity (hard) — always runs; the template itself must be valid.
  results.push(runChild("config-integrity", ctx.config.severity["config-integrity"], CONFIG_VALIDATOR, [REPO_ROOT]));

  // 2. Contrast gate (hard) + coverage (soft) — only when a build manifest exists.
  if (isFile(CONTRAST_MANIFEST)) {
    results.push(runChild("contrast-check", ctx.config.severity["contrast-check"], CONTRAST_CHECK, [CONTRAST_MANIFEST]));
    results.push(runChild("contrast-coverage", ctx.config.severity["contrast-coverage"], CONTRAST_COVERAGE, [CONTRAST_MANIFEST]));
  } else {
    results.push(result("contrast-check", ctx.config.severity["contrast-check"], [], { skipped: true, note: "no accessibility/contrast.config.json yet" }));
  }

  // 3. llms.txt prohibition (hard) — a "never do" in CLAUDE.md Hard Limitations.
  const llms = ["llms.txt", "site/llms.txt", "public/llms.txt", "out/llms.txt"]
    .filter((c) => isFile(join(REPO_ROOT, c)))
    .map((c) => ({ level: "error", msg: "llms.txt present — forbidden as an AI-Search tactic", file: c }));
  results.push(result("llms-txt", ctx.config.severity["llms-txt"], llms));

  // 4. In-process linters.
  results.push(schemaInjection(ctx)); // hard
  results.push(robotsPolicy(ctx));    // hard
  results.push(copyLint(ctx));        // soft
  results.push(seoMeta(ctx));         // soft
  results.push(schemaLint(ctx));      // soft
  results.push(servedDom(ctx));       // soft
  results.push(tokenDrift(ctx));      // soft
  return results;
}

function buildExists(stack) {
  if (!stack) return false;
  if (stack === "static") return isDir(join(REPO_ROOT, "site"));
  return isDir(join(REPO_ROOT, "app")) || isDir(join(REPO_ROOT, "src", "app"));
}

function makeCtx() {
  const config = loadConfig();
  const advisory = has("--advisory");
  if (advisory) for (const k of Object.keys(config.severity)) if (config.severity[k] === "hard") config.severity[k] = "soft";
  const changedRaw = valOf("--changed");
  return {
    config,
    stack: detectStack(),
    changed: changedRaw ? changedRaw.split(",").map((s) => s.trim()).filter(Boolean) : null,
    strict: has("--strict"),
  };
}

function summarize(results, ctx) {
  const blocking = results.filter((r) => r.blocking);
  const warnings = results.reduce((n, r) => n + (r.blocking ? 0 : r.findings.length), 0);
  const strictTrip = ctx.strict && results.some((r) => r.findings.length);
  return { blocking, warnings, exit: blocking.length || strictTrip ? 1 : 0 };
}

// ---- Hook: Stop -----------------------------------------------------------
async function readStdin() { const c = []; for await (const ch of process.stdin) c.push(ch); return Buffer.concat(c).toString("utf8"); }

if (has("--hook-stop")) {
  const ctx = makeCtx();
  if (!buildExists(ctx.stack)) process.exit(0); // nothing built yet — do not block
  const results = gather(ctx);
  const { blocking, warnings } = summarize(results, ctx);
  if (!blocking.length) process.exit(0); // clean (warnings alone never block the turn)
  const lines = blocking.flatMap((r) => [`• ${r.gate}:`, ...r.findings.filter((f) => f.level === "error").map((f) => `    - ${f.msg}${f.file ? ` (${f.file})` : ""}`)]);
  const reason = `Build audit found ${blocking.length} blocking issue(s) — fix before finishing:\n${lines.join("\n")}\n(${warnings} advisory finding(s) also noted; run /build-audit for the full report.)`;
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
  process.exit(0);
}

// ---- Hook: PostToolUse ----------------------------------------------------
if (has("--hook-posttooluse")) {
  const raw = await readStdin().catch(() => "");
  let file = null;
  try { file = JSON.parse(raw)?.tool_input?.file_path || null; } catch { /* ignore */ }
  if (!file) process.exit(0);
  if (!/\.(html|tsx|jsx|css|md|mdx|ts)$/.test(file)) process.exit(0);
  // Audit build OUTPUT only — never the .claude template config, repo meta docs
  // (README, plans), or vendored dirs. The file must live under a build root.
  const relPath = file.replace(REPO_ROOT + "/", "");
  if (/(^|\/)(\.claude|node_modules|\.next|\.git|dist|build)(\/|$)/.test(relPath)) process.exit(0);
  if (!/^(site|app|src|pages|components|public|out)\//.test(relPath)) process.exit(0);
  const config = loadConfig();
  for (const k of Object.keys(config.severity)) config.severity[k] = "soft"; // advisory only
  const ctx = { config, stack: detectStack(), changed: [file], strict: false };
  const results = [copyLint(ctx), seoMeta(ctx), schemaLint(ctx), schemaInjection(ctx), servedDom(ctx), tokenDrift(ctx)];
  const findings = results.flatMap((r) => r.findings.map((f) => ({ ...f, gate: r.gate })));
  if (!findings.length) process.exit(0);
  const ctxMsg = `Audit findings on ${file}:\n` + findings.map((f) => `- [${f.gate}] ${f.msg}`).join("\n");
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: ctxMsg } }));
  process.exit(0);
}

// ---- Default / CI / prebuild ---------------------------------------------
const ctx = makeCtx();
const results = gather(ctx);
const { blocking, warnings, exit } = summarize(results, ctx);

if (has("--json")) {
  process.stdout.write(JSON.stringify({ stack: ctx.stack, results, blocking: blocking.length, warnings, exit }, null, 2));
  process.exit(exit);
}

console.log(`HMM build audit — stack: ${ctx.stack || "none detected"}${ctx.changed ? ` (changed: ${ctx.changed.length} file[s])` : ""}\n`);
for (const r of results) printResult(r);
console.log(`\n${blocking.length} blocking, ${warnings} advisory finding(s).`);
if (exit) console.log(blocking.length ? "FAIL — hard gate(s) blocking." : "FAIL — --strict and findings present.");
else console.log("PASS — no blocking gates.");
process.exit(exit);

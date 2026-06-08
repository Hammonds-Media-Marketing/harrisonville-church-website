#!/usr/bin/env node
// schema-lint — two gates for JSON-LD:
//   run()          SOFT — every <script type="application/ld+json"> in served
//                  HTML parses as JSON and carries @context + @type.
//   runInjection() HARD — no client-side JSON-LD injection. CLAUDE.md forbids
//                  injecting schema via JavaScript; it must be in the served
//                  HTML on first response. Flags source that builds an
//                  application/ld+json <script> at runtime (createElement, or
//                  dangerouslySetInnerHTML inside a 'use client' module).
import { join } from "node:path";
import { walk, read, result, printResult, loadConfig, detectStack, REPO_ROOT } from "./lib.mjs";

const LD_BLOCK = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

export function run(ctx) {
  const { config } = ctx;
  const sev = config.severity["schema-lint"];
  const root = ctx.stack ? config.roots[ctx.stack]?.served : null;
  const findings = [];
  let files = ctx.changed
    ? ctx.changed.filter((f) => f.endsWith(".html"))
    : (root ? walk(join(REPO_ROOT, root), [".html"], config.ignoreDirs) : []);
  if (!files.length) return result("schema-lint", sev, [], { skipped: true, note: "no served HTML to scan yet" });

  for (const file of files) {
    const rel = file.replace(REPO_ROOT + "/", "");
    let html;
    try { html = read(file.startsWith("/") ? file : join(REPO_ROOT, file)); } catch { continue; }
    const blocks = [...html.matchAll(LD_BLOCK)];
    if (!blocks.length) { findings.push({ level: "warn", msg: "no JSON-LD in served HTML", file: rel }); continue; }
    for (const b of blocks) {
      let json;
      try { json = JSON.parse(b[1].trim()); }
      catch (e) { findings.push({ level: "warn", msg: `invalid JSON-LD: ${e.message}`, file: rel }); continue; }
      const nodes = Array.isArray(json) ? json : json["@graph"] || [json];
      for (const n of nodes) {
        if (!n || typeof n !== "object") continue;
        if (json["@context"] === undefined && n["@context"] === undefined) findings.push({ level: "warn", msg: "JSON-LD missing @context", file: rel });
        if (n["@type"] === undefined) findings.push({ level: "warn", msg: "JSON-LD node missing @type", file: rel });
      }
    }
  }
  return result("schema-lint", sev, findings);
}

export function runInjection(ctx) {
  const { config } = ctx;
  const sev = config.severity["schema-injection"];
  const findings = [];
  // Scan source trees regardless of stack — injection is a source-level smell.
  const roots = ["app", "components", "pages", "src", "site"].map((d) => join(REPO_ROOT, d));
  let files = ctx.changed
    ? ctx.changed.filter((f) => /\.(tsx|jsx|ts|js|mjs|html)$/.test(f))
    : roots.flatMap((d) => walk(d, [".tsx", ".jsx", ".ts", ".js", ".mjs", ".html"], config.ignoreDirs));

  for (const file of files) {
    const rel = file.replace(REPO_ROOT + "/", "");
    let text;
    try { text = read(file.startsWith("/") ? file : join(REPO_ROOT, file)); } catch { continue; }
    if (!/application\/ld\+json/i.test(text)) continue;
    const isClient = /^['"]use client['"]/m.test(text);
    if (/document\.createElement\(\s*['"]script['"]/.test(text) && /ld\+json/i.test(text))
      findings.push({ level: "error", msg: "JSON-LD injected via document.createElement — must be in served HTML", file: rel });
    if (isClient && /(dangerouslySetInnerHTML|innerHTML)/.test(text) && /ld\+json/i.test(text))
      findings.push({ level: "error", msg: "JSON-LD rendered inside a 'use client' module — move to a Server Component / served HTML", file: rel });
  }
  return result("schema-injection", sev, findings);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ctx = { root: REPO_ROOT, config: loadConfig(), stack: detectStack(), changed: null, strict: process.argv.includes("--strict") };
  const a = run(ctx), b = runInjection(ctx);
  printResult(b); printResult(a);
  process.exit(b.blocking || (ctx.strict && (a.findings.length + b.findings.length)) ? 1 : 0);
}

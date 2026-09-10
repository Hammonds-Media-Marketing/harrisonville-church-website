#!/usr/bin/env node
// served-dom-check — confirms primary content is present in the raw served HTML
// without JavaScript, per CLAUDE.md Agentic Readiness ("all primary content must
// be present in the served DOM"). For each served HTML page it checks:
//   · meaningful visible text exists in the static markup (not just a JS shell)
//   · a <main> landmark is present (semantic HTML / accessibility tree intact)
// Static builds always have served HTML; a Next.js build only has it after
// `output: export`, so this skips cleanly when no served HTML exists. Soft gate.
import { join } from "node:path";
import { walk, read, htmlToText, result, runStandalone, REPO_ROOT } from "./lib.mjs";

const MIN_TEXT_WORDS = 25; // a real page has at least this much copy in raw HTML

export function run(ctx) {
  const { config } = ctx;
  const sev = config.severity["served-dom"];
  const root = ctx.stack ? config.roots[ctx.stack]?.served : null;
  const findings = [];

  let files = ctx.changed
    ? ctx.changed.filter((f) => f.endsWith(".html"))
    : (root ? walk(join(REPO_ROOT, root), [".html"], config.ignoreDirs) : []);

  if (!files.length) {
    const note = ctx.stack === "next" ? "Next build has no exported HTML (output: export not set) — verify served DOM in the running app" : "no served HTML to scan yet";
    return result("served-dom", sev, [], { skipped: true, note });
  }

  for (const file of files) {
    const rel = file.replace(REPO_ROOT + "/", "");
    let html;
    try { html = read(file.startsWith("/") ? file : join(REPO_ROOT, file)); } catch { continue; }
    const words = (htmlToText(html).match(/\b\w+\b/g) || []).length;
    if (words < MIN_TEXT_WORDS) findings.push({ level: "warn", msg: `only ${words} words of content in raw HTML — content may be JS-gated`, file: rel });
    if (!/<main\b/i.test(html)) findings.push({ level: "warn", msg: "no <main> landmark", file: rel });
  }

  return result("served-dom", sev, findings);
}

if (import.meta.url === `file://${process.argv[1]}`) runStandalone(run);

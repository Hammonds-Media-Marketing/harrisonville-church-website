#!/usr/bin/env node
// copy-lint — enforces the machine-checkable CLAUDE.md "Universal Content & Copy
// Rules" and "Hard Limitations" against the copy a build actually ships:
//   · banned generic marketing filler ("comprehensive solutions", …)
//   · First/Second/Third & First/Then/Finally transition structures
//   · em-dash density above the AI-writing-tell threshold
//   · contractions in formal brand copy
//   · presence of an llms.txt file (a hard prohibition)
// Scans served HTML (visible text only), Markdown, and JSX text nodes — not raw
// code identifiers — to keep false positives low. Soft gate by default.
import { join } from "node:path";
import { walk, htmlToText, read, result, runStandalone, REPO_ROOT } from "./lib.mjs";

// Extract just the human copy from a file so we don't lint code identifiers.
function copyFrom(file) {
  const text = read(file);
  if (file.endsWith(".html")) return htmlToText(text);
  if (file.endsWith(".md") || file.endsWith(".mdx")) {
    return text.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
  }
  // .tsx/.jsx: pull JSX text nodes ( >text< ) and string literals, skip braces.
  const chunks = [];
  for (const m of text.matchAll(/>([^<>{}]+)</g)) chunks.push(m[1]);
  for (const m of text.matchAll(/(["'])([^"'\n]{8,})\1/g)) chunks.push(m[2]);
  return chunks.join(" ");
}

export function run(ctx) {
  const { config } = ctx;
  const sev = config.severity["copy-lint"];
  const c = config.copy;
  const root = ctx.changed ? null : (ctx.stack ? config.roots[ctx.stack]?.served : null);
  const findings = [];
  // Note: the llms.txt prohibition is a HARD gate owned by verify-build.mjs, not here.

  const exts = [".html", ".md", ".mdx", ".tsx", ".jsx"];
  let files = ctx.changed
    ? ctx.changed.filter((f) => exts.some((e) => f.endsWith(e)))
    : (root ? walk(join(REPO_ROOT, root), exts, config.ignoreDirs) : []);

  const banned = c.bannedPhrases.map((p) => p.toLowerCase());
  const transitions = c.transitionPhrases.map((p) => p.toLowerCase());
  const allow = new Set((c.contractionAllow || []).map((s) => s.toLowerCase()));

  for (const file of files) {
    let copy;
    try { copy = copyFrom(file.startsWith("/") ? file : join(REPO_ROOT, file)); } catch { continue; }
    const lower = copy.toLowerCase();
    const rel = file.replace(REPO_ROOT + "/", "");

    for (const phrase of banned) if (lower.includes(phrase)) findings.push({ level: "warn", msg: `banned filler: "${phrase}"`, file: rel });
    for (const t of transitions) {
      const re = new RegExp(`(^|[.\\n]\\s+)${t.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}`, "i");
      if (re.test(copy)) findings.push({ level: "warn", msg: `transition structure: "${t.trim()}"`, file: rel });
    }
    for (const con of c.contractions) {
      if (allow.has(con)) continue;
      if (new RegExp(`\\b${con.replace("'", "['’]")}\\b`, "i").test(copy)) {
        findings.push({ level: "warn", msg: `contraction in formal copy: "${con}"`, file: rel });
        break; // one note per file is enough
      }
    }
    const words = (copy.match(/\b\w+\b/g) || []).length;
    const emDashes = (copy.match(/—/g) || []).length;
    if (words > 100 && emDashes / words * 1000 > c.emDashMaxPer1000Words) {
      findings.push({ level: "warn", msg: `em-dash density ${(emDashes / words * 1000).toFixed(1)}/1000 words (>${c.emDashMaxPer1000Words}) — AI-writing tell`, file: rel });
    }
  }

  if (!ctx.changed && !root) return result("copy-lint", sev, [], { skipped: true, note: "no served output to scan yet" });
  return result("copy-lint", sev, findings);
}

if (import.meta.url === `file://${process.argv[1]}`) runStandalone(run);

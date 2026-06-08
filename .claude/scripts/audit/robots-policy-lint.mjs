#!/usr/bin/env node
// robots-policy-lint — verifies a build's robots policy against the single source
// of truth in .claude/references/bot-policy.md. HARD gate on the core rule:
// no allowlisted retrieval/indexing bot may be disallowed (that would shadow the
// site out of Search / AI-Search retrieval). Warns when a training scraper that
// should be disallowed is missing. Parses static site/robots.txt and Next
// app/robots.ts (best-effort). Skips cleanly when neither exists yet.
import { join } from "node:path";
import { read, isFile, result, runStandalone, REPO_ROOT } from "./lib.mjs";

export function loadPolicy() {
  const md = read(join(REPO_ROOT, ".claude", "references", "bot-policy.md"));
  const m = md.match(/```json\s*([\s\S]*?)```/);
  if (!m) throw new Error("bot-policy.md has no machine-readable JSON block");
  return JSON.parse(m[1]);
}

// agent (lowercased) -> { disallowRoot, allowRoot }
function parseRobotsTxt(text) {
  const map = new Map();
  let current = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) { current = []; continue; }
    const ua = line.match(/^user-agent\s*:\s*(.+)$/i);
    if (ua) { const a = ua[1].trim().toLowerCase(); current.push(a); if (!map.has(a)) map.set(a, { disallowRoot: false, allowRoot: false }); continue; }
    const dis = line.match(/^disallow\s*:\s*(.*)$/i);
    if (dis && current.length) { const v = dis[1].trim(); for (const a of current) if (v === "/") map.get(a).disallowRoot = true; continue; }
    const al = line.match(/^allow\s*:\s*(.*)$/i);
    if (al && current.length) { const v = al[1].trim(); for (const a of current) if (v === "/" || v === "") map.get(a).allowRoot = true; }
  }
  return map;
}

function parseRobotsTs(text) {
  const map = new Map();
  // Match { ... } objects that mention userAgent; tolerate arrays of agents.
  for (const obj of text.matchAll(/\{[^{}]*userAgent[^{}]*\}/gi)) {
    const block = obj[0];
    const agents = [];
    const arr = block.match(/userAgent\s*:\s*\[([^\]]*)\]/i);
    if (arr) for (const m of arr[1].matchAll(/["']([^"']+)["']/g)) agents.push(m[1].toLowerCase());
    else { const one = block.match(/userAgent\s*:\s*["']([^"']+)["']/i); if (one) agents.push(one[1].toLowerCase()); }
    const disallowRoot = /disallow\s*:\s*(\[[^\]]*["']\/["'][^\]]*\]|["']\/["'])/i.test(block);
    const allowRoot = /allow\s*:\s*(\[[^\]]*["']\/["'][^\]]*\]|["']\/["'])/i.test(block);
    for (const a of agents) {
      const e = map.get(a) || { disallowRoot: false, allowRoot: false };
      e.disallowRoot = e.disallowRoot || disallowRoot;
      e.allowRoot = e.allowRoot || allowRoot;
      map.set(a, e);
    }
  }
  return map;
}

export function run(ctx) {
  const { config } = ctx;
  const sev = config.severity["robots-policy"];
  const findings = [];
  let policy;
  try { policy = loadPolicy(); } catch (e) { return result("robots-policy", sev, [{ level: "error", msg: e.message, file: ".claude/references/bot-policy.md" }]); }

  const txt = join(REPO_ROOT, "site", "robots.txt");
  const ts = [join(REPO_ROOT, "app", "robots.ts"), join(REPO_ROOT, "src", "app", "robots.ts")].find(isFile);
  let map, file;
  if (isFile(txt)) { map = parseRobotsTxt(read(txt)); file = "site/robots.txt"; }
  else if (ts) { map = parseRobotsTs(read(ts)); file = ts.replace(REPO_ROOT + "/", ""); }
  else return result("robots-policy", sev, [], { skipped: true, note: "no robots.txt / robots.ts yet" });

  const star = map.get("*");
  for (const bot of policy.allow) {
    const e = map.get(bot.toLowerCase());
    if (e && e.disallowRoot && !e.allowRoot)
      findings.push({ level: "error", msg: `retrieval bot "${bot}" is Disallow: / — it must stay allowed`, file });
    // If a blanket * disallow exists and this bot has no explicit allow group, it is shadowed.
    if (star && star.disallowRoot && !e)
      findings.push({ level: "error", msg: `retrieval bot "${bot}" shadowed by "User-agent: * / Disallow: /" with no explicit allow group`, file });
  }
  for (const bot of policy.disallow) {
    const e = map.get(bot.toLowerCase());
    if (!e || !e.disallowRoot)
      findings.push({ level: "warn", msg: `training scraper "${bot}" is not disallowed`, file });
  }

  return result("robots-policy", sev, findings);
}

if (import.meta.url === `file://${process.argv[1]}`) runStandalone(run);

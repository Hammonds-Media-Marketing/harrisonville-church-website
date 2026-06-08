#!/usr/bin/env node
// seo-meta-lint — checks the served <head> + heading/image hygiene the CLAUDE.md
// Universal SEO Requirements mandate, on every served HTML page:
//   · exactly one <h1>            · alt on every <img>
//   · <title> present, sane length · meta description present, sane length
//   · <link rel="canonical">       · og:title present AND ≠ meta title
//   · og:description present AND ≠ meta description
//   · meta title & description unique across all pages
// Operates on served HTML (static: site/, Next export: out/). Skips cleanly when
// no served HTML exists yet. Soft gate by default.
import { join } from "node:path";
import { walk, read, result, runStandalone, REPO_ROOT } from "./lib.mjs";

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return m ? m[1].trim() : null;
};
const metaContent = (html, key, by = "name") => {
  const re = new RegExp(`<meta\\b[^>]*\\b${by}\\s*=\\s*["']${key}["'][^>]*>`, "i");
  const m = html.match(re);
  return m ? attr(m[0], "content") : null;
};

export function run(ctx) {
  const { config } = ctx;
  const sev = config.severity["seo-meta"];
  const root = ctx.stack ? config.roots[ctx.stack]?.served : null;
  const findings = [];

  let files = ctx.changed
    ? ctx.changed.filter((f) => f.endsWith(".html"))
    : (root ? walk(join(REPO_ROOT, root), [".html"], config.ignoreDirs) : []);

  if (!files.length) return result("seo-meta", sev, [], { skipped: true, note: "no served HTML to scan yet" });

  const titles = new Map(), descs = new Map();
  for (const file of files) {
    const rel = file.replace(REPO_ROOT + "/", "");
    let html;
    try { html = read(file.startsWith("/") ? file : join(REPO_ROOT, file)); } catch { continue; }

    const h1s = html.match(/<h1\b/gi) || [];
    if (h1s.length === 0) findings.push({ level: "warn", msg: "no <h1>", file: rel });
    if (h1s.length > 1) findings.push({ level: "warn", msg: `${h1s.length} <h1> elements (expected exactly 1)`, file: rel });

    for (const img of html.match(/<img\b[^>]*>/gi) || []) {
      if (attr(img, "alt") === null) findings.push({ level: "warn", msg: "img missing alt", file: rel });
    }

    const titleM = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleM ? titleM[1].trim() : null;
    if (!title) findings.push({ level: "warn", msg: "missing <title>", file: rel });
    else {
      if (title.length < config.seo.titleMin || title.length > config.seo.titleMax)
        findings.push({ level: "warn", msg: `title length ${title.length} (want ${config.seo.titleMin}-${config.seo.titleMax})`, file: rel });
      if (titles.has(title)) findings.push({ level: "warn", msg: `duplicate meta title (also in ${titles.get(title)})`, file: rel });
      else titles.set(title, rel);
    }

    const desc = metaContent(html, "description");
    if (!desc) findings.push({ level: "warn", msg: "missing meta description", file: rel });
    else {
      if (desc.length < config.seo.metaDescriptionMin || desc.length > config.seo.metaDescriptionMax)
        findings.push({ level: "warn", msg: `meta description length ${desc.length} (want ${config.seo.metaDescriptionMin}-${config.seo.metaDescriptionMax})`, file: rel });
      if (descs.has(desc)) findings.push({ level: "warn", msg: `duplicate meta description (also in ${descs.get(desc)})`, file: rel });
      else descs.set(desc, rel);
    }

    if (!/<link\b[^>]*rel\s*=\s*["']canonical["']/i.test(html)) findings.push({ level: "warn", msg: "missing canonical link", file: rel });

    const ogTitle = metaContent(html, "og:title", "property") || metaContent(html, "og:title");
    const ogDesc = metaContent(html, "og:description", "property") || metaContent(html, "og:description");
    if (!ogTitle) findings.push({ level: "warn", msg: "missing og:title", file: rel });
    else if (title && ogTitle === title) findings.push({ level: "warn", msg: "og:title identical to meta title (must differ)", file: rel });
    if (!ogDesc) findings.push({ level: "warn", msg: "missing og:description", file: rel });
    else if (desc && ogDesc === desc) findings.push({ level: "warn", msg: "og:description identical to meta description (must differ)", file: rel });
  }

  return result("seo-meta", sev, findings);
}

if (import.meta.url === `file://${process.argv[1]}`) runStandalone(run);

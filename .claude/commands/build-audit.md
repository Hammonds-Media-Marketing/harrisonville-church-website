---
description: Run the full HMM build audit — mechanical gates plus every skill's audit mode — and report consolidated pass/fail.
---

Run the complete final-review audit for the current build. This is the Stage 8
gate of the Build Sequence and the on-demand version of what the Stop hook runs.

## 1. Mechanical gates

Run the orchestrator and read its report:

```
node .claude/scripts/audit/verify-build.mjs
```

It runs: config integrity, the color-contrast gate + coverage linter (when a
build manifest exists), the JSON-LD injection check, the robots policy check
(against `.claude/references/bot-policy.md`), and the copy / SEO-meta / schema /
served-DOM / token-drift linters. Hard gates block; soft gates surface findings.
Fix every **blocking** item before declaring the build done, and resolve soft
findings unless there is a deliberate reason to keep them.

## 2. Skill audit passes (run each against the build's own output)

The mechanical gates do not replace human-grade review. Run each skill in its
**audit mode** against what this build actually produced — this is the step that
makes the skills earn their keep instead of only shaping the first draft:

- **website-schema-builder** — run its AUDIT mode on every JSON-LD block: schema.org validity + Google Rich Results rules. Report Valid / Warnings / Errors.
- **eeat-content-writer** — run the 9-item red-flag checklist and the self-assessment questionnaire over the page copy.
- **web-accessibility** — run the Code Audit workflow (landmarks, ARIA names/roles, keyboard operability, focus states) beyond the contrast slice the gate already covers.
- **laws-of-ux** — run Diagnose → Prescribe → Justify over the primary layouts and conversion paths.
- **hmm-behavioral-science-copywriting** — run the 21-item checklist over CTAs, social proof, and headline copy.

## 3. Raw-HTML / no-JS confirmation

Confirm primary content and JSON-LD are present in the served HTML without
JavaScript (the served-dom gate flags shells; verify the actual content is real).

## 4. Consolidated report

Print one summary: each mechanical gate (pass / blocked / advisory count) and
each skill audit (pass / issues found), then an overall **READY** or
**NOT READY** verdict with the specific blocking items listed. If anything is
blocking, fix and re-run from step 1 — loop until the verdict is READY.

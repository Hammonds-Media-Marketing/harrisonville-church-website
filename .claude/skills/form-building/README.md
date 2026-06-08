# form-building (Claude Code skill)

A self-contained Claude Code skill that wires a Next.js App Router contact
form to a hosted form endpoint (Formspree by default) with anti-spam
honeypot and last-touch UTM attribution captured to localStorage.

## Files

- `SKILL.md` — the skill itself. Frontmatter + instructions Claude reads.
- `templates/ContactForm.tsx.template` — full form component template.
- `templates/AttributionTracker.tsx.template` — page-level capture component.
- `templates/env.example` — `NEXT_PUBLIC_FORMSPREE_ENDPOINT`.
- `references/attribution-model.md` — last-touch vs first-touch + payload shape.
- `references/performance.md` — useEffect + requestIdleCallback rationale.
- `references/providers.md` — Formspree → Resend → self-hosted gateway.

The `.tsx.template` extension keeps TypeScript from trying to compile the
templates while they live next to a Next.js project (the project's tsconfig
typically has `**/*.tsx` in `include`). Once the skill is moved to its
final home (`~/.claude/skills/form-building/` or a private skills repo),
you can rename to `.tsx` if you want IDE syntax highlighting.

## Installing

### Local (per machine)
```bash
mkdir -p ~/.claude/skills
cp -r form-building ~/.claude/skills/
```
or symlink for live edits:
```bash
ln -s "$PWD/form-building" ~/.claude/skills/form-building
```

### CI (GitHub Actions)
The expected pattern is a small composite action in your shared skills repo
that does the equivalent `cp -r` into `$HOME/.claude/skills/` before the
Claude Code step runs. This package doesn't ship that action — it lives
wherever you keep your skills collection.

## Verifying the skill is loaded

In Claude Code, list available skills (the system reminder lists them at
session start). `form-building` should appear with the description from
`SKILL.md`'s frontmatter. Triggering phrases include "wire up the contact
form", "the form goes nowhere", "add UTM tracking to the form", "add a
honeypot".

## Updating the skill

When you find a better pattern in a project, update the templates here
first, then re-distribute. Tag releases (`v1`, `v2`, …) if you have client
workflows pinning to a specific version.

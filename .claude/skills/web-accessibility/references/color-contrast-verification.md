# Color Contrast Verification Protocol
## Deterministic, Computed Verification — Never Eyeball

Contrast failures are the single most common accessibility defect, and they
are the one defect a human (or an AI) cannot reliably catch by looking.
Two colors that "look fine" can fail 4.5:1, and — the worst case — a
heading whose color token resolves to the **same value as its background**
renders completely invisible while looking perfectly fine in source code.

**The rule that fixes this: contrast is never judged by eye. Every
foreground/background pairing is resolved to concrete sRGB values and the
ratio is computed with the WCAG formula below.** A pairing is only
"accessible" once a number proves it.

---

## 0. Brand Rules Never Override Contrast

Color contrast accessibility **always** wins. If a brand guide, Style Guide
token, client preference, or design comp specifies a color pairing that
computes below the required ratio, the accessible color is used — in every
context, with no exception. Brand palettes are adjusted to meet contrast,
never the reverse. When a brand color cannot pass, darken/lighten it (or
swap the paired color) until it does, and note the substitution. Do not ship
an on-brand pairing that fails, and do not ask whether brand "allows" the
fix — accessibility is the higher authority here.

---

## 1. Required Ratios

| Content | Minimum (AA) | Target (AAA) |
|---|---|---|
| Normal text (< 18pt, or < 14pt bold) | **4.5:1** | **7:1** |
| Large text (≥ 18pt / 24px, or ≥ 14pt / 18.66px bold) | **3:1** | **4.5:1** |
| UI component boundaries & graphical objects (button/input borders, icons, focus rings, chart segments) | **3:1** | — |
| Focus indicator vs. adjacent colors (WCAG 2.2 SC 2.4.11/2.4.13) | **3:1** | — |
| Disabled controls | exempt from SC 1.4.3, but verify anyway | — |

"Large" is a size threshold, not a vibe — confirm the computed font size
before applying the 3:1 tier. When unsure, hold the pairing to 4.5:1.

---

## 2. Enumerate Every Pairing — Including the Ones That Get Missed

Build an explicit list of foreground/background pairs. The failures you
described (invisible headings, button hover) get missed because people check
only the default resting state of body text. Check all of these:

- Body text, every heading level (`h1`–`h6`), captions, labels, links,
  link `:visited`, link `:hover`, placeholder text, helper/error text.
- Buttons and interactive controls in **every state**: default, `:hover`,
  `:focus`, `:active`, `:disabled`, and selected/pressed (`aria-pressed`,
  `aria-current`). Hover and focus usually change background, text color, or
  both — each variant is a new pairing that must be recomputed.
- Text over images, gradients, or video: test against the **lightest and
  darkest** pixel the text can sit over (or against the scrim/overlay color
  if one is applied). If any sampled region fails, add a scrim.
- Non-text: button/input borders, dividers that carry meaning, focus rings,
  toggle states, icon glyphs, chart/graph colors, required-field asterisks.
- Both color schemes when a dark mode / `prefers-color-scheme` variant
  exists — each scheme is a separate full pass.

Every pairing above becomes one entry in the contrast manifest (Section 5).

---

## 3. Resolve Tokens to Concrete sRGB — Do Not Skip This Step

The invisible-heading bug happens when a color is left as a token
(`var(--heading)`) and never traced to its literal value. Resolve every
color to an `rgb()` triple (plus alpha) **before** computing:

- **CSS custom properties (`var(--x)`):** follow the chain to the literal
  value declared in `:root` / the Style Guide / `globals.css`. If the
  variable is redefined in a nested scope, media query, `[data-theme]`, or
  `.dark` class, evaluate **each** context separately — the same token can be
  light in one scope and dark in another.
- **`currentColor`:** resolves to the inherited `color` value — trace it.
- **Keywords:** map named colors (`white`, `black`, `rebeccapurple`, …),
  `transparent` (= `rgba(0,0,0,0)`), and system colors to their sRGB values.
- **Formats:** normalize `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`,
  `rgb()/rgba()`, and `hsl()/hsla()` to sRGB.
- **Alpha compositing:** a semi-transparent foreground (e.g.
  `rgba(0,0,0,.6)`, or text on a translucent panel) must be **composited
  over its actual background** first, then compared. Comparing the
  pre-composited color gives a wrong, usually too-optimistic ratio. The
  script does this for you.

**Explicit invisible-text check:** if a resolved foreground equals (or is
within a hair of) its resolved background, the ratio is ~1.0:1 and the text
is invisible. Treat any computed ratio below ~1.2:1 as a hard error and a
likely token mix-up (two different tokens that resolve to the same hex), not
a near-miss to nudge. The script flags this for you.

---

## 4. The WCAG Math

For each sRGB channel value `C` in `{R, G, B}`, normalize to `0–1`, then
linearize:

```
cs = C / 255
clin = cs <= 0.04045 ? cs / 12.92 : ((cs + 0.055) / 1.055) ^ 2.4
```

Relative luminance:

```
L = 0.2126 * Rlin + 0.7152 * Glin + 0.0722 * Blin
```

Contrast ratio (Llight = lighter luminance, Ldark = darker):

```
ratio = (Llight + 0.05) / (Ldark + 0.05)
```

Ratios run from 1:1 (identical) to 21:1 (pure black on pure white).

---

## 5. Run the Bundled Script — Do Not Compute By Hand

The verifier ships with this skill at `assets/contrast-check.mjs` (no
dependencies). It is **manifest-driven**: it auto-loads the site's CSS custom
properties from the files you list, resolves every `var(--token)`, composites
alpha, computes the WCAG ratio for each pairing, flags the near-1:1
invisible-text trap, and exits non-zero if anything fails. Because it reads
the live CSS variables, an edit that points a heading token at the surface
color is caught the next time it runs.

Two bundled files scaffold into the site:

- `assets/contrast-check.mjs` → copy to `scripts/contrast-check.mjs`
- `assets/contrast.config.example.json` → copy to
  `accessibility/contrast.config.json`, then list every pairing and state
  from Section 2. A pairing that references a token which no longer exists
  fails the run, so the manifest cannot silently drift from the Style Guide.

Manifest shape:

```jsonc
{
  "cssFiles": ["app/globals.css"],   // auto-loads --tokens from the Style Guide
  "tokens": {},                       // optional inline overrides
  "pairs": [
    { "name": "body / page",        "fg": "var(--color-ink)",        "bg": "var(--color-bg)" },
    { "name": "h2 / surface",       "fg": "var(--color-heading)",    "bg": "var(--color-surface)", "large": true },
    { "name": "primary btn :hover", "fg": "var(--color-on-primary)", "bg": "var(--color-primary-hover)" },
    { "name": "btn border / page",  "fg": "var(--color-primary)",    "bg": "var(--color-bg)", "ui": true }
  ]
}
```

Run it: `node scripts/contrast-check.mjs` (or pass a config path as the first
argument). A non-zero exit means the build is not accessible yet — fix the
color, then re-run until it exits clean.

---

## 6. Wire It as a Build Gate

The check is only reliable if it runs automatically. Scaffold both layers
into every generated site so a failing pairing blocks the build locally and
in CI:

**Local — block `next build`.** npm runs a `prebuild` script automatically
before `build`, so the gate cannot be skipped:

```jsonc
// package.json
{
  "scripts": {
    "contrast": "node scripts/contrast-check.mjs",
    "prebuild": "node scripts/contrast-check.mjs",
    "build": "next build"
  }
}
```

**CI — block the PR.** Copy `assets/accessibility-contrast.yml` to
`.github/workflows/accessibility-contrast.yml`. It runs the same script on
every push and pull request; a failure marks the check red and blocks merge
(enforce via branch protection / required status check).

Run the gate at Build Sequence step 13 (final accessibility review) and keep
it in CI thereafter so contrast cannot regress when tokens or component
states change.

---

## 6a. Coverage Linter — Catch Pairings Nobody Registered

The gate only checks the pairings listed in the manifest; it cannot test a
pairing no one wrote down. The companion linter `assets/contrast-coverage.mjs`
closes that gap. Copy it to `scripts/contrast-coverage.mjs`, then it scans the
component source (`coverage.sources` in the manifest) for color-bearing
declarations — `color`, `background`, `border-color`, focus rings, inline
style objects, and Tailwind arbitrary values like `bg-[var(--x)]` and
`hover:bg-[var(--x)]` — and reports every color token used in the UI that no
manifest pairing covers, flagging interactive-state usages (`:hover`,
`:focus`, …) specifically and listing hard-coded literals that should be
tokens.

```jsonc
// package.json
{
  "scripts": {
    "contrast": "node scripts/contrast-check.mjs",
    "contrast:coverage": "node scripts/contrast-coverage.mjs",
    "prebuild": "node scripts/contrast-check.mjs && node scripts/contrast-coverage.mjs",
    "build": "next build"
  }
}
```

Coverage is heuristic, so it **warns by default and exits 0** — it will not
hard-block a build on a false positive. When a warning is real, add the
missing pairing to the manifest (the gate then enforces it). Once a site's
manifest is complete, set `coverage.failOnUncovered: true` (or run with
`--strict`) to turn the linter into a second hard gate. The bundled CI
workflow runs the linter after the gate.

---

## 7. How to Fix a Failing Pairing

1. Decide which color moves. Prefer adjusting the color with more headroom
   (often the background or a tint), keeping the design intent intact.
2. Step luminance until the computed ratio clears the target — do not stop
   at "looks better." Re-run the script.
3. For text over imagery, add or darken a scrim/overlay rather than recoloring
   text per-image.
4. For UI borders/icons failing 3:1, thicken or recolor the boundary; a
   larger element does not lower the 3:1 requirement.
5. Record any brand-color substitution made for compliance (Section 0).

---

## 8. Reporting

For each finding: element + state, resolved fg/bg (with the literal values,
not the token names), computed ratio, required ratio, pass/fail, and the
corrected color with its new ratio. Lead the report with any
invisible/near-1:1 results — those are launch-blocking.

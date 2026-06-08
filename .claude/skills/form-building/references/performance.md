# Performance notes

The form wiring touches three timing-sensitive moments. Getting each one right keeps the form from costing measurable LCP / TTI / INP.

## 1. Server render

Both `AttributionTracker` and the form component are `'use client'`. Their bodies don't run on the server. The HTML the server emits is the form skeleton (or the `null` from AttributionTracker), no JS work involved.

**Don't:** try to read `localStorage` or `window.location` at the top level of the file or inside the component body — those run during SSR and will throw.

## 2. Hydration

When the page hydrates, React attaches event handlers but does not run any `useEffect`. Both components are no-ops during hydration itself. The form is interactive once hydration finishes; visitors can start typing immediately.

**Don't:** put `localStorage` reads in synchronous component body code. Always `useEffect`.

## 3. Post-hydration (capture + populate)

After hydration, both `useEffect`s run. They each do this:

```ts
const idle = window.requestIdleCallback
if (idle) {
  idle(work, { timeout: 2000 /* or 1000 */ })
} else {
  setTimeout(work, 0)
}
```

`requestIdleCallback` defers `work` until the browser has spare main-thread time — typically 0–50ms after LCP, often longer if the browser is still decoding images or running other JS. The `timeout` ensures we run within that ceiling regardless of how busy the browser is.

| Concern | Without idle scheduling | With idle scheduling |
|---|---|---|
| Time-to-interactive | Possibly slightly worse | Untouched |
| Total Blocking Time | +0.5–2ms in heavy renders | 0 |
| Form populate before user can type | Always | Always — even on slowest devices the timeout caps at 1s, far before a human reads the form and starts typing |

Browser support: `requestIdleCallback` is in every modern browser except Safari < 15.4. The `setTimeout(_, 0)` fallback covers Safari and any other holdouts.

## Why uncontrolled inputs

Visible inputs use no `value`/`onChange`. The submit handler reads them via `new FormData(e.currentTarget)`. Three reasons:

1. **External script compatibility.** Tag managers, autofill helpers, CRM widgets, and the populate effect itself all write directly to `input.value` on the DOM. Controlled inputs would overwrite those writes on the next React render. Uncontrolled inputs preserve the DOM value as-is.
2. **Less re-render work.** Controlled forms re-render the entire form on every keystroke. Uncontrolled forms re-render zero times during typing. Negligible perf impact at this size, but free.
3. **Less code.** No state object, no `handleChange`, no individual `value` props. The form's logic is just the submit handler and a populate effect.

The tradeoff: no per-keystroke validation. If the project later wants live email/phone validation, switch *only those fields* to controlled with `useState`, and leave the rest uncontrolled. The hidden tracking inputs must stay uncontrolled regardless.

## Bundle cost

The full form component + AttributionTracker adds ~1.5KB gzipped to the page chunk in a typical Next.js build. Most of that is the form's own markup; the tracker is a few hundred bytes.

## What gets blocked vs deferred

| Work | When | Blocking? |
|---|---|---|
| Render form HTML | SSR | N/A — happens before client JS arrives |
| Hydrate form | After JS loads | Tied to React's hydration cost, not form-specific |
| Capture attribution | Idle, post-hydration | Never blocks |
| Populate hidden inputs | Idle, post-hydration | Never blocks |
| Form submit (`fetch`) | On user click | Network-bound, async, never blocks render |

LCP, FCP, and INP are unaffected by anything in this skill.

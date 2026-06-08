# Attribution model

## What this skill captures

For every page load, the AttributionTracker reads:

| Source | Captured as |
|---|---|
| `?utm_source=` | `utm_source` |
| `?utm_medium=` | `utm_medium` |
| `?utm_campaign=` | `utm_campaign` |
| `?utm_content=` | `utm_content` |
| `?utm_term=` | `utm_term` |
| `?gclid=` (Google Ads) | `gclid` |
| `?msclkid=` (Microsoft Ads) | `msclkid` |
| `document.referrer` (external only) | `original_referrer` |
| `window.location.href` (at capture time) | `landing_url` |
| `new Date().toISOString()` | `captured_at` |

## Storage shape

Single localStorage key: `hm_attribution`. Single JSON object.

```json
{
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "home-insurance-norman",
  "utm_content": "ad-variant-a",
  "utm_term": "home insurance norman ok",
  "gclid": "Cj0KCQiA...",
  "original_referrer": "https://www.google.com/",
  "landing_url": "https://example.com/?utm_source=google&...",
  "captured_at": "2026-04-30T19:32:11.482Z"
}
```

Fields are only present when they have non-empty values. A direct-traffic visitor with no UTMs and no referrer leaves nothing in localStorage at all.

## Last-touch vs first-touch

This skill defaults to **last-touch**: every new campaign hit overwrites the stored payload. The most recent attribution wins.

| | Last-touch (default) | First-touch | Both |
|---|---|---|---|
| Captures most recent ad click | ✅ | ❌ | ✅ |
| Survives a re-engagement campaign | ✅ writes new | ❌ keeps old | ✅ both |
| Storage size | 1 object | 1 object | 2 objects |
| Use case | Performance marketing, recent ROAS | Discovery / brand attribution | CRM analysts who want both |

### To switch to first-touch

In `AttributionTracker.tsx`, replace the `if (hasFreshAttribution)` branch with:

```ts
if (hasFreshAttribution && !existing) {
  // Only persist if nothing already stored — preserves first touch.
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}
```

### To capture both

Use two storage keys (`hm_attribution_first` written once, `hm_attribution_last` written every visit), and have the form populate effect read both, prefixing field names with `first_` and `last_`. The hidden inputs become 16 fields instead of 8. Most CRMs handle this fine; check before committing.

## What is NOT captured

- **Click IDs from other ad networks** (`fbclid`, `ttclid`, `dclid`, `wbraid`, `gbraid`). Add them to `TRACKED_PARAMS` if the project runs ads on those networks.
- **Page path / scroll depth / time on site.** This is attribution capture, not analytics. Use Plausible / GA4 / similar for behavioral data.
- **First-party identity.** No user IDs, no cookies, no fingerprinting. Just URL params + referrer.
- **Cross-device journey.** localStorage is per-browser, per-device. A user who clicks an ad on mobile and converts on desktop loses the link.

## Privacy + consent considerations

`localStorage` writes generally do **not** require consent in the EU/UK if the data is strictly necessary for the service the user requested (here: attaching the visit context to a form they're submitting). Marketing cookies are a different category.

If the project has a consent banner that gates "marketing" or "analytics" categories, gate the `AttributionTracker` mount behind that consent. Common pattern:

```tsx
{consent.marketing && <AttributionTracker />}
```

In doubt, ask the project's compliance contact. The default in this skill is unconditional capture, which is appropriate for most US-only B2C sites.

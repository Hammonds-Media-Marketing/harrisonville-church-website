import { site } from '@/lib/site'

/**
 * Placeholders an editor may leave inside a copy field so the congregation's
 * contact details stay in one place. The legal pages use them heavily: their
 * wording is editable, but the name, email, phone, and address they cite come
 * from lib/site.ts, which also feeds the schema markup and the footer. Editing
 * those details is a code change on purpose — one edit updates the whole site.
 *
 * An unknown placeholder is left exactly as typed rather than blanked out, so a
 * typo is visible in the editor instead of silently deleting words.
 */
export const COPY_TOKENS: Record<string, string> = {
  'site.name': site.name,
  'site.email': site.email,
  'site.phone': site.phoneDisplay,
  'site.address': `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`,
}

/** Human-readable list for the editor's help text. */
export const COPY_TOKEN_HINT = Object.keys(COPY_TOKENS)
  .map((name) => `{${name}}`)
  .join(', ')

export function applyCopyTokens(value: string): string {
  return value.replace(/\{([a-z.]+)\}/g, (whole, name: string) => COPY_TOKENS[name] ?? whole)
}

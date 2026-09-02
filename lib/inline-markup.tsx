import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * The small markup an editor may use inside a copy field: a link written as
 * [label](/path) and emphasis written as **bold**. Nothing else is
 * interpreted, so an editor cannot introduce raw HTML, scripts, or markup that
 * breaks the page's typography.
 *
 * Two renderers share one tokenizer. `renderInline` produces React nodes for
 * the served HTML — internal paths render through next/link so client-side
 * navigation and prefetching keep working. `inlineToHtml` produces the same
 * markup as an escaped HTML string, which the visual editor writes into its
 * live preview frame as the editor types.
 */

type Token =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'link'; text: string; href: string }

/** Link targets an editor may point at. Anything else renders as plain text. */
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/|#)/i

const PATTERN = /\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*/g

export function tokenizeInline(input: string): Token[] {
  const tokens: Token[] = []
  let last = 0
  for (const match of input.matchAll(PATTERN)) {
    const start = match.index ?? 0
    if (start > last) tokens.push({ type: 'text', text: input.slice(last, start) })

    const [, linkText, href, boldText] = match
    if (boldText !== undefined) {
      tokens.push({ type: 'bold', text: boldText })
    } else if (href && SAFE_HREF.test(href)) {
      tokens.push({ type: 'link', text: linkText, href })
    } else {
      // An unsupported target keeps the words and loses only the link.
      tokens.push({ type: 'text', text: linkText })
    }
    last = start + match[0].length
  }
  if (last < input.length) tokens.push({ type: 'text', text: input.slice(last) })
  return tokens
}

export function renderInline(input: string): ReactNode {
  const tokens = tokenizeInline(input)
  if (tokens.length === 1 && tokens[0].type === 'text') return tokens[0].text

  return tokens.map((token, i) => {
    if (token.type === 'text') return token.text
    if (token.type === 'bold') {
      return (
        <strong key={i} className="text-heading">
          {token.text}
        </strong>
      )
    }
    if (token.href.startsWith('/') || token.href.startsWith('#')) {
      return (
        <Link key={i} href={token.href}>
          {token.text}
        </Link>
      )
    }
    // mailto: and tel: hand off to another app; only the web opens in a tab.
    const external = /^https?:/i.test(token.href)
    return (
      <a key={i} href={token.href} {...(external ? { rel: 'noopener noreferrer', target: '_blank' } : {})}>
        {token.text}
      </a>
    )
  })
}

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

export function inlineToHtml(input: string): string {
  return tokenizeInline(input)
    .map((token) => {
      const text = escapeHtml(token.text)
      if (token.type === 'text') return text
      if (token.type === 'bold') return `<strong class="text-heading">${text}</strong>`
      return `<a href="${escapeHtml(token.href)}">${text}</a>`
    })
    .join('')
}

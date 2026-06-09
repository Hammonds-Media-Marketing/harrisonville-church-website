'use client'

import { useEffect, useState } from 'react'

/** Sticky table of contents built from the article's h2 headings. Highlights
 *  the section currently in view. Fully keyboard navigable (plain anchor list). */
export function TableOfContents({ items }: { items: { id: string; text: string }[] }) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)

  useEffect(() => {
    if (!items.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-96px 0px -65% 0px', threshold: 0 }
    )
    for (const item of items) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [items])

  if (!items.length) return null

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-2 font-body font-semibold uppercase tracking-wide text-muted">On this page</p>
      <ul className="flex flex-col gap-1 border-l border-border/60">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={activeId === item.id ? 'true' : undefined}
              className={`-ml-px block border-l-2 py-1 pl-3 transition-colors ${
                activeId === item.id
                  ? 'border-primary-strong font-semibold text-primary-strong'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

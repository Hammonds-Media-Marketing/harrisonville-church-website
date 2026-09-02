'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/primitives/Avatar'
import { ChevronLeftIcon, UsersIcon } from '@/components/ui/icons'

/**
 * Full-height conversation shell. On phones it pins to the visual viewport
 * so the composer rides above the keyboard; on desktop it is a tall card
 * under the members bar. The header is a translucent overlay so the first
 * messages scroll beneath it.
 */
export function ThreadFrame({
  title,
  kind,
  photo,
  photoPosition,
  subtitle,
  children,
}: {
  title: string
  kind: 'group' | 'direct'
  photo?: string | null
  photoPosition?: string
  subtitle?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const mq = window.matchMedia('(min-width: 768px)')
    let raf = 0
    const layout = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (mq.matches) {
          el.style.top = ''
          el.style.height = ''
          return
        }
        const vv = window.visualViewport
        const top = vv?.offsetTop ?? 0
        const height = vv?.height ?? window.innerHeight
        el.style.top = `${top}px`
        el.style.height = `${height}px`
      })
    }
    layout()
    window.addEventListener('resize', layout)
    window.visualViewport?.addEventListener('resize', layout)
    window.visualViewport?.addEventListener('scroll', layout)
    mq.addEventListener('change', layout)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', layout)
      window.visualViewport?.removeEventListener('resize', layout)
      window.visualViewport?.removeEventListener('scroll', layout)
      mq.removeEventListener('change', layout)
    }
  }, [])

  return (
    <div
      ref={ref}
      className="thread-frame fixed inset-x-0 top-0 z-overlay flex flex-col bg-bg md:static md:mx-auto md:my-6 md:h-[calc(100dvh-14rem)] md:min-h-[32rem] md:max-w-4xl md:overflow-hidden md:rounded-lg md:border md:border-border-strong/40 md:shadow-md"
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-border/50 bg-bg/90 px-3 py-2 backdrop-blur sm:px-4">
        <Link href="/members/chat" aria-label="Back to all conversations" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-primary-strong hover:bg-surface">
          <ChevronLeftIcon className="h-6 w-6" />
        </Link>
        {kind === 'group' ? (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-primary-strong">
            <UsersIcon className="h-5 w-5" />
          </span>
        ) : (
          <Avatar name={title} photo={photo} photoPosition={photoPosition} size="sm" />
        )}
        <div className="min-w-0">
          <p className="m-0 truncate font-display text-lg font-semibold text-heading">{title}</p>
          {subtitle ? <p className="m-0 truncate text-xs text-muted">{subtitle}</p> : null}
        </div>
      </header>
      {children}
    </div>
  )
}

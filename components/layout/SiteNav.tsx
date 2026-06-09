'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import type { NavItem } from '@/lib/site'
import { Button } from '@/components/primitives/Button'
import { ChevronDownIcon, CloseIcon, MenuIcon } from '@/components/ui/icons'

/**
 * Primary site navigation. Interactive by nature (dropdown disclosure + mobile
 * drawer), so it is a Client Component — but every link is rendered into the
 * DOM regardless of open state, so crawlers and retrieval agents see the full
 * navigation. Keyboard: Escape closes; focus-out and outside-click close.
 */
export function SiteNav({ items, cta }: { items: NavItem[]; cta: { label: string; href: string } }) {
  const pathname = usePathname()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const baseId = useId()

  // Close everything on route change.
  useEffect(() => {
    setOpenMenu(null)
    setMobileOpen(false)
  }, [pathname])

  // Escape + outside click close the desktop dropdown.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null)
        setMobileOpen(false)
      }
    }
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }, [])

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <nav ref={navRef} aria-label="Primary" className="flex items-center gap-2">
      {/* Desktop navigation */}
      <ul className="hidden items-center gap-1 lg:flex">
        {items.map((item) => {
          const menuId = `${baseId}-${item.label}`
          if (!item.children) {
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={`inline-flex rounded-full px-4 py-2 text-md font-semibold transition-colors hover:bg-surface ${
                    isActive(item.href) ? 'text-primary-strong' : 'text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            )
          }
          const open = openMenu === item.label
          return (
            <li
              key={item.label}
              className="relative"
              onPointerEnter={() => setOpenMenu(item.label)}
              onPointerLeave={() => setOpenMenu((cur) => (cur === item.label ? null : cur))}
            >
              <button
                type="button"
                aria-expanded={open}
                aria-controls={menuId}
                onClick={() => setOpenMenu(open ? null : item.label)}
                className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-md font-semibold transition-colors hover:bg-surface ${
                  isActive(item.href) ? 'text-primary-strong' : 'text-ink'
                }`}
              >
                {item.label}
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              <div
                id={menuId}
                hidden={!open}
                className="absolute left-0 top-full z-header w-72 pt-2"
              >
                <ul className="rounded-lg border border-border/60 bg-bg p-2 shadow-lg">
                  {item.children.map((child) => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        className="block rounded-md px-3 py-2 hover:bg-surface"
                        aria-current={isActive(child.href) ? 'page' : undefined}
                      >
                        <span className="block font-semibold text-ink">{child.label}</span>
                        {child.description ? (
                          <span className="block text-sm text-muted">{child.description}</span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="hidden lg:block">
        <Button href={cta.href} size="sm">
          {cta.label}
        </Button>
      </div>

      {/* Mobile toggle */}
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md p-2 text-ink lg:hidden"
        aria-expanded={mobileOpen}
        aria-controls={`${baseId}-mobile`}
        onClick={() => setMobileOpen((v) => !v)}
      >
        <span className="sr-only">{mobileOpen ? 'Close menu' : 'Open menu'}</span>
        {mobileOpen ? <MenuIconState close /> : <MenuIconState />}
      </button>

      {/* Mobile drawer */}
      <div
        id={`${baseId}-mobile`}
        hidden={!mobileOpen}
        className="fixed inset-x-0 top-[var(--header-h,72px)] z-overlay border-t border-border/60 bg-bg lg:hidden"
      >
        <ul className="max-h-[calc(100vh-72px)] overflow-y-auto px-5 py-4">
          {items.map((item) => (
            <li key={item.label} className="border-b border-border/40 py-2">
              <Link href={item.href} className="block py-2 text-lg font-semibold text-ink">
                {item.label}
              </Link>
              {item.children ? (
                <ul className="pb-2 pl-3">
                  {item.children.map((child) => (
                    <li key={child.href}>
                      <Link href={child.href} className="block py-2 text-md text-muted">
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
          <li className="pt-4">
            <Button href={cta.href} className="w-full">
              {cta.label}
            </Button>
          </li>
        </ul>
      </div>
    </nav>
  )
}

function MenuIconState({ close = false }: { close?: boolean }) {
  return close ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />
}

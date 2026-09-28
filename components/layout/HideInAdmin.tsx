'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Leaves out the public site chrome inside the admin area. Editors and admins
 * work there with the members bar and the admin tabs, so the visitor
 * navigation only takes up room above the editor. The chrome itself stays a
 * server component; this wrapper only decides whether to render it.
 */
export function HideInAdmin({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/members/admin' || pathname?.startsWith('/members/admin/')) return null
  return <>{children}</>
}

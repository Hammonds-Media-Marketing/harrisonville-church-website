'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/primitives/Button'
import { Dialog } from '@/components/primitives/Dialog'
import { Avatar } from '@/components/primitives/Avatar'
import { PencilIcon } from '@/components/ui/icons'
import type { PersonSummary } from '@/lib/portal/types'

/** Start a direct message: search approved members, pick one. */
export function NewMessagePicker({ people }: { people: Array<PersonSummary & { familyName: string | null }> }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return people.filter((p) => !needle || p.fullName.toLowerCase().includes(needle) || (p.familyName ?? '').toLowerCase().includes(needle)).slice(0, 30)
  }, [people, q])

  return (
    <>
      <Button type="button" variant="primary" size="sm" onClick={() => setOpen(true)}>
        <PencilIcon className="h-4 w-4" /> New message
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Message a member" size="sm">
        <label htmlFor="dm-search" className="sr-only">
          Search members
        </label>
        <input
          id="dm-search"
          type="search"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or family"
          className="mb-3 w-full rounded-md border border-border bg-input-bg px-4 py-3 text-ink placeholder:text-placeholder focus:border-primary-strong"
        />
        <ul className="m-0 max-h-80 list-none overflow-y-auto p-0">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  router.push(`/members/chat/direct/${p.id}`)
                }}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface"
              >
                <Avatar name={p.fullName} photo={p.photo} photoPosition={p.photoPosition} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-heading">{p.fullName}</span>
                  {p.familyName ? <span className="block truncate text-xs text-muted">{p.familyName}</span> : null}
                </span>
              </button>
            </li>
          ))}
          {!results.length ? <li className="px-2 py-4 text-center text-sm text-muted">No one matches that search.</li> : null}
        </ul>
      </Dialog>
    </>
  )
}

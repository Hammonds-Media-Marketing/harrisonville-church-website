import type { ReactNode } from 'react'

/**
 * A visible, honest banner shown above any section rendered from placeholder
 * content. It keeps the build truthful: nothing sample is dressed up as final.
 * Remove (or let it disappear automatically) once real content replaces the
 * seed data.
 */
export function SampleNotice({ label }: { label: ReactNode }) {
  return (
    <div
      role="note"
      className="mb-6 flex items-start gap-3 rounded-md border border-warning/40 bg-surface px-4 py-3 text-sm text-ink"
    >
      <span className="mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
      <p>
        <span className="font-semibold text-warning">Sample content.</span> {label} The structure is final;
        the church will supply the real details before launch.
      </p>
    </div>
  )
}

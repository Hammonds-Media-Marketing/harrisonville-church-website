import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Selection and option primitives for the member portal.
 *
 *  - SegmentedControl: a small set of mutually exclusive views (Month / Week
 *    / Day, Sign in / Request access). Renders links when `href` is given so
 *    the state lives in the URL, otherwise buttons.
 *  - Switch: an on/off preference row that posts through a normal form.
 *  - RadioCards: a radio group rendered as tappable cards (RSVP choices).
 */

type Segment<T extends string> = { value: T; label: ReactNode; href?: string }

export function SegmentedControl<T extends string>({
  label,
  value,
  segments,
  onChange,
  size = 'md',
}: {
  label: string
  value: T
  segments: Segment<T>[]
  onChange?: (value: T) => void
  size?: 'sm' | 'md'
}) {
  const pad = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'
  return (
    <div role="group" aria-label={label} className="segmented-control inline-flex rounded-full border border-border-strong bg-surface p-1">
      {segments.map((s) => {
        const active = s.value === value
        const cls = `rounded-full font-semibold transition-colors ${pad} ${
          active ? 'bg-primary-strong text-on-primary shadow-sm' : 'text-primary-strong hover:bg-surface-2 hover:text-primary-strong'
        }`
        if (s.href) {
          return (
            <Link key={s.value} href={s.href} aria-current={active ? 'page' : undefined} className={cls} scroll={false}>
              {s.label}
            </Link>
          )
        }
        return (
          <button key={s.value} type="button" aria-pressed={active} onClick={() => onChange?.(s.value)} className={cls}>
            {s.label}
          </button>
        )
      })}
    </div>
  )
}

/** Labeled on/off switch. Uncontrolled: it is a checkbox inside a form. */
export function Switch({
  id,
  name,
  label,
  helper,
  defaultChecked,
  disabled,
}: {
  id: string
  name: string
  label: string
  helper?: string
  defaultChecked?: boolean
  disabled?: boolean
}) {
  return (
    <label htmlFor={id} className={`switch-row flex cursor-pointer items-start justify-between gap-4 py-3 ${disabled ? 'opacity-60' : ''}`}>
      <span className="flex flex-col gap-0.5">
        <span className="font-semibold text-heading">{label}</span>
        {helper ? (
          <span id={`${id}-helper`} className="text-sm text-muted">
            {helper}
          </span>
        ) : null}
      </span>
      <span className="relative mt-1 inline-flex shrink-0">
        <input
          id={id}
          name={name}
          type="checkbox"
          role="switch"
          defaultChecked={defaultChecked}
          disabled={disabled}
          aria-describedby={helper ? `${id}-helper` : undefined}
          className="switch-input peer sr-only"
        />
        <span
          aria-hidden="true"
          className="switch-track block h-7 w-12 rounded-full border border-border-strong bg-surface-2 transition-colors peer-checked:border-primary-strong peer-checked:bg-primary-strong peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
        />
        <span
          aria-hidden="true"
          className="switch-thumb pointer-events-none absolute left-1 top-1 h-5 w-5 rounded-full bg-bg shadow-sm transition-transform peer-checked:translate-x-5"
        />
      </span>
    </label>
  )
}

/** Radio group rendered as cards; one choice per row, keyboard-native. */
export function RadioCards({
  name,
  legend,
  options,
  defaultValue,
}: {
  name: string
  legend: string
  options: Array<{ value: string; label: string; helper?: string }>
  defaultValue?: string | null
}) {
  return (
    <fieldset className="radio-cards flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 font-semibold text-heading">{legend}</legend>
      {options.map((o) => (
        <label
          key={o.value}
          className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-bg px-4 py-3 transition-colors has-[:checked]:border-primary-strong has-[:checked]:bg-surface"
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            defaultChecked={defaultValue === o.value}
            className="mt-1 h-5 w-5 shrink-0 accent-primary-strong"
          />
          <span className="flex flex-col">
            <span className="font-semibold text-heading">{o.label}</span>
            {o.helper ? <span className="text-sm text-muted">{o.helper}</span> : null}
          </span>
        </label>
      ))}
    </fieldset>
  )
}

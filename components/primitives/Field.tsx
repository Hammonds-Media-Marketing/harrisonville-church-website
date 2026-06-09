import type { ReactNode } from 'react'

/**
 * Form field primitives — label, helper text, and error states defined once and
 * shared across every form. Inputs are uncontrolled (no value/onChange) so the
 * attribution populate effect and any external script can write to them; the
 * form reads values via FormData on submit. Contrast for borders, placeholder,
 * and focus is verified by the contrast gate.
 */

const fieldBase =
  'w-full rounded-md border bg-input-bg px-4 py-3 text-ink placeholder:text-placeholder border-border focus:border-primary-strong'

export function FieldShell({
  id,
  label,
  required,
  helper,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  helper?: string
  error?: string
  children: ReactNode
}) {
  const describedBy = [helper ? `${id}-helper` : null, error ? `${id}-error` : null].filter(Boolean).join(' ')
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold text-heading">
        {label}{' '}
        {required ? (
          <span className="text-error" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {helper ? (
        <p id={`${id}-helper`} className="text-sm text-muted">
          {helper}
        </p>
      ) : null}
      <div data-described-by={describedBy || undefined}>{children}</div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-semibold text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function TextField({
  id,
  name,
  type = 'text',
  required,
  autoComplete,
  placeholder,
}: {
  id: string
  name: string
  type?: string
  required?: boolean
  autoComplete?: string
  placeholder?: string
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      required={required}
      aria-required={required || undefined}
      autoComplete={autoComplete}
      placeholder={placeholder}
      className={fieldBase}
    />
  )
}

export function TextArea({
  id,
  name,
  required,
  rows = 4,
  placeholder,
}: {
  id: string
  name: string
  required?: boolean
  rows?: number
  placeholder?: string
}) {
  return (
    <textarea
      id={id}
      name={name}
      required={required}
      aria-required={required || undefined}
      rows={rows}
      placeholder={placeholder}
      className={`${fieldBase} resize-y`}
    />
  )
}

export function SelectField({
  id,
  name,
  required,
  options,
  placeholder = 'Select an option',
}: {
  id: string
  name: string
  required?: boolean
  options: string[]
  placeholder?: string
}) {
  return (
    <select id={id} name={name} required={required} aria-required={required || undefined} defaultValue="" className={fieldBase}>
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

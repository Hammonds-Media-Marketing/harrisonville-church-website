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
      <div data-described-by={describedBy || undefined}>{children}</div>
      {helper ? (
        <p id={`${id}-helper`} className="text-sm text-muted">
          {helper}
        </p>
      ) : null}
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
  defaultValue,
  minLength,
}: {
  id: string
  name: string
  type?: string
  required?: boolean
  autoComplete?: string
  placeholder?: string
  defaultValue?: string
  minLength?: number
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
      defaultValue={defaultValue}
      minLength={minLength}
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
  defaultValue,
}: {
  id: string
  name: string
  required?: boolean
  rows?: number
  placeholder?: string
  defaultValue?: string
}) {
  return (
    <textarea
      id={id}
      name={name}
      required={required}
      aria-required={required || undefined}
      rows={rows}
      placeholder={placeholder}
      defaultValue={defaultValue}
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
  defaultValue = '',
}: {
  id: string
  name: string
  required?: boolean
  options: string[]
  placeholder?: string
  defaultValue?: string
}) {
  return (
    <select
      id={id}
      name={name}
      required={required}
      aria-required={required || undefined}
      defaultValue={defaultValue}
      className={fieldBase}
    >
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

/** Labeled checkbox — used for the directory privacy toggles and admin flags. */
export function CheckboxField({
  id,
  name,
  label,
  defaultChecked,
  helper,
}: {
  id: string
  name: string
  label: string
  defaultChecked?: boolean
  helper?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        aria-describedby={helper ? `${id}-helper` : undefined}
        className="mt-1 h-5 w-5 shrink-0 rounded border-border accent-primary-strong"
      />
      <span className="flex flex-col gap-0.5">
        <label htmlFor={id} className="font-semibold text-heading">
          {label}
        </label>
        {helper ? (
          <span id={`${id}-helper`} className="text-sm text-muted">
            {helper}
          </span>
        ) : null}
      </span>
    </div>
  )
}

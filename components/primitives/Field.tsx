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

/** Small "What is this?" affordance next to a field label. Pure CSS show/hide
 *  (hover and keyboard focus), so it works inside Server Component forms. */
export function FieldTip({ id, label, tip }: { id: string; label: string; tip: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={`About the ${label} field`}
        aria-describedby={`${id}-tip`}
        className="grid h-5 w-5 place-items-center rounded-full border border-border-strong text-xs font-bold leading-none text-muted transition-colors hover:border-primary-strong hover:text-primary-strong focus-visible:border-primary-strong focus-visible:text-primary-strong"
      >
        ?
      </button>
      <span
        role="tooltip"
        id={`${id}-tip`}
        className="pointer-events-none invisible absolute left-0 top-full z-20 mt-2 w-64 rounded-md bg-surface-deep px-3 py-2 text-sm font-normal normal-case tracking-normal text-on-deep opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {tip}
      </span>
    </span>
  )
}

export function FieldShell({
  id,
  label,
  required,
  helper,
  tip,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  helper?: string
  /** Plain-language tooltip explaining what the field is for. */
  tip?: string
  error?: string
  children: ReactNode
}) {
  const describedBy = [helper ? `${id}-helper` : null, error ? `${id}-error` : null].filter(Boolean).join(' ')
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-2">
        <label htmlFor={id} className="font-semibold text-heading">
          {label}{' '}
          {required ? (
            <span className="text-error" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {tip ? <FieldTip id={id} label={label} tip={tip} /> : null}
      </span>
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
  /** Plain strings, or value/label pairs when the stored value differs from
   *  the wording shown to the editor. */
  options: Array<string | { value: string; label: string }>
  placeholder?: string
  defaultValue?: string
}) {
  const normalized = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  const hasEmptyOption = normalized.some((o) => o.value === '')
  return (
    <select
      id={id}
      name={name}
      required={required}
      aria-required={required || undefined}
      defaultValue={defaultValue}
      className={fieldBase}
    >
      {hasEmptyOption ? null : (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {normalized.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
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

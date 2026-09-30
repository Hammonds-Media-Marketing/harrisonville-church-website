'use client'

import { useRef, useState } from 'react'
import { FieldShell, FieldTip, TextArea, TextField } from '@/components/primitives/Field'
import { Button } from '@/components/primitives/Button'
import { ImageUploadField } from '@/components/members/ImageUploadField'

export type RepeaterFieldDef = {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'datetime-local' | 'image'
  required?: boolean
  helper?: string
  /** Storage sub-folder, for image fields. */
  folder?: string
  /** Lays the field out side by side with the next half-width field. */
  half?: boolean
}

/**
 * A list of repeated field groups in the admin editors — event dates,
 * speakers, FAQs, extra sections. Every row posts its fields under the same
 * names (`${prefix}_${key}`), so the server action reads each column with
 * FormData.getAll() and zips rows by position; no hidden JSON to keep in sync.
 */
export function RepeaterField({
  id,
  prefix,
  label,
  itemLabel,
  addLabel,
  fields,
  initialRows,
  minRows = 0,
  helper,
  tip,
}: {
  id: string
  prefix: string
  label: string
  /** Heading for one row, numbered: "Date 1", "Speaker 2". */
  itemLabel: string
  addLabel: string
  fields: RepeaterFieldDef[]
  initialRows: Array<Record<string, string>>
  minRows?: number
  helper?: string
  tip?: string
}) {
  const nextKey = useRef(0)
  const withKey = (values: Record<string, string>) => ({ key: nextKey.current++, values })
  const [rows, setRows] = useState(() => {
    const start = initialRows.map(withKey)
    while (start.length < minRows) start.push(withKey({}))
    return start
  })
  const [announcement, setAnnouncement] = useState('')

  const add = () => {
    setRows((r) => [...r, withKey({})])
    setAnnouncement(`${itemLabel} ${rows.length + 1} added.`)
  }
  const remove = (index: number) => {
    setRows((r) => r.filter((_, i) => i !== index))
    setAnnouncement(`${itemLabel} ${index + 1} removed.`)
  }
  const move = (index: number, by: -1 | 1) => {
    setRows((r) => {
      const next = [...r]
      const [row] = next.splice(index, 1)
      next.splice(index + by, 0, row)
      return next
    })
    setAnnouncement(`${itemLabel} moved to position ${index + by + 1}.`)
  }

  return (
    <fieldset className="flex flex-col gap-3" aria-describedby={helper ? `${id}-helper` : undefined}>
      <legend className="mb-1.5 flex items-center gap-2 font-semibold text-heading">
        {label}
        {tip ? <FieldTip id={id} label={label} tip={tip} /> : null}
      </legend>
      {helper ? (
        <p id={`${id}-helper`} className="-mt-1 text-sm text-muted">
          {helper}
        </p>
      ) : null}

      {rows.map((row, index) => {
        const rowId = `${id}-${row.key}`
        return (
          <div key={row.key} className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-heading">
                {itemLabel} {index + 1}
              </p>
              <span className="flex flex-wrap items-center gap-1">
                {index > 0 ? (
                  <Button type="button" variant="link" onClick={() => move(index, -1)} aria-label={`Move ${itemLabel.toLowerCase()} ${index + 1} up`}>
                    Move up
                  </Button>
                ) : null}
                {index < rows.length - 1 ? (
                  <Button type="button" variant="link" onClick={() => move(index, 1)} aria-label={`Move ${itemLabel.toLowerCase()} ${index + 1} down`}>
                    Move down
                  </Button>
                ) : null}
                {rows.length > minRows ? (
                  <Button type="button" variant="link" onClick={() => remove(index)} aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}>
                    Remove
                  </Button>
                ) : null}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => {
                const fieldId = `${rowId}-${f.key}`
                const name = `${prefix}_${f.key}`
                const value = row.values[f.key] ?? ''
                const span = f.half ? '' : 'sm:col-span-2'
                if (f.type === 'image') {
                  return (
                    <div key={f.key} className={span}>
                      <ImageUploadField id={fieldId} name={name} label={f.label} folder={f.folder ?? 'events'} defaultValue={value} helper={f.helper} />
                    </div>
                  )
                }
                return (
                  <div key={f.key} className={span}>
                    <FieldShell id={fieldId} label={f.label} required={f.required} helper={f.helper}>
                      {f.type === 'textarea' ? (
                        <TextArea id={fieldId} name={name} rows={3} required={f.required} defaultValue={value} />
                      ) : (
                        <TextField id={fieldId} name={name} type={f.type ?? 'text'} required={f.required} defaultValue={value} />
                      )}
                    </FieldShell>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={add}>
        {addLabel}
      </Button>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </fieldset>
  )
}

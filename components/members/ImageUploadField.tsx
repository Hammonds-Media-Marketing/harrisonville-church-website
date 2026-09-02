'use client'

import { useRef, useState } from 'react'
import { FieldTip } from '@/components/primitives/Field'
import { Button } from '@/components/primitives/Button'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { slugify } from '@/lib/format'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']

/**
 * Image picker for the admin editors. Editors choose a photo from their
 * device; it uploads to the public "media" storage bucket and the resulting
 * URL travels with the form in a hidden input — no paths to type. Storage
 * write access is limited to editors by Row Level Security on the bucket.
 */
export function ImageUploadField({
  id,
  name,
  label,
  folder,
  defaultValue = '',
  required,
  helper,
  tip,
  onChange,
}: {
  id: string
  /** Omit when a parent (the page builder) owns the value via onChange. */
  name?: string
  label: string
  /** Bucket sub-folder that keeps uploads organized: events, articles, sermons. */
  folder: string
  defaultValue?: string
  required?: boolean
  helper?: string
  tip?: string
  onChange?: (url: string) => void
}) {
  const [url, setUrlState] = useState(defaultValue)
  const setUrl = (value: string) => {
    setUrlState(value)
    onChange?.(value)
  }
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = getSupabaseBrowser()

  async function handleFile(file: File | undefined) {
    if (!file || !supabase) return
    setError('')
    if (!ACCEPTED.includes(file.type)) {
      setError('That file type is not supported. Choose a JPG, PNG, WebP, AVIF, or GIF image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('That image is larger than 5 MB. Resize it, or choose a smaller photo.')
      return
    }

    setUploading(true)
    const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase() : 'jpg'
    const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image'
    const path = `${folder}/${Date.now()}-${base}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, file, { cacheControl: '31536000', upsert: false })

    if (uploadError) {
      console.warn('[admin] image upload failed:', uploadError.message)
      setError('The upload did not go through. Check your connection and try again.')
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('media').getPublicUrl(path)
    setUrl(data.publicUrl)
    setUploading(false)
  }

  const statusId = `${id}-status`
  const helperId = helper ? `${id}-helper` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-2">
        <span className="font-semibold text-heading" id={`${id}-label`}>
          {label}{' '}
          {required ? (
            <span className="text-error" aria-hidden="true">
              *
            </span>
          ) : null}
        </span>
        {tip ? <FieldTip id={id} label={label} tip={tip} /> : null}
      </span>

      {name ? <input type="hidden" name={name} value={url} /> : null}

      {supabase ? (
        <div className="flex flex-wrap items-center gap-4 rounded-md border border-border bg-input-bg p-4">
          {url ? (
            <span className="relative block h-20 w-28 shrink-0 overflow-hidden rounded-md bg-surface-2">
              {/* Plain img: previews arrive straight from storage and skip the optimizer. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </span>
          ) : (
            <span className="grid h-20 w-28 shrink-0 place-items-center rounded-md border border-dashed border-border-strong text-xs text-muted">
              No image yet
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
            <input
              ref={fileRef}
              id={id}
              type="file"
              accept={ACCEPTED.join(',')}
              className="sr-only"
              aria-labelledby={`${id}-label`}
              aria-describedby={[statusId, helperId].filter(Boolean).join(' ') || undefined}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <span className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? 'Uploading…' : url ? 'Replace image' : 'Choose image'}
              </Button>
              {url && !uploading ? (
                <Button type="button" variant="link" onClick={() => setUrl('')}>
                  Remove
                </Button>
              ) : null}
            </span>
            <span id={statusId} role="status" className="max-w-full truncate text-sm text-muted">
              {uploading ? 'Uploading your image…' : url ? url.split('/').pop() : 'JPG, PNG, WebP, AVIF, or GIF up to 5 MB.'}
            </span>
          </div>
        </div>
      ) : (
        /* Without a configured Supabase project (local preview), fall back to a path field. */
        <input
          id={id}
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-labelledby={`${id}-label`}
          aria-describedby={helperId}
          className="w-full rounded-md border border-border bg-input-bg px-4 py-3 text-ink placeholder:text-placeholder focus:border-primary-strong"
          placeholder="/assets/images/placeholder.jpg"
        />
      )}

      {helper ? (
        <p id={helperId} className="text-sm text-muted">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

'use client'

import { useRef, useState } from 'react'
import { FieldTip } from '@/components/primitives/Field'
import { Button } from '@/components/primitives/Button'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { slugify } from '@/lib/format'

const MAX_BYTES = 50 * 1024 * 1024
const ACCEPTED = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/ogg']
const ACCEPT_ATTR = '.mp3,.m4a,.aac,.wav,.ogg,audio/*'

/**
 * Audio picker for sermon recordings. Mirrors ImageUploadField: the editor
 * chooses an MP3 from their device, it uploads to the public "sermon-audio"
 * bucket (editors-only writes, enforced by Row Level Security), and the
 * resulting URL travels with the form in a hidden input. A recording hosted
 * elsewhere can be pasted as a link instead. The player preview lets the
 * editor confirm it is the right recording before saving.
 */
export function AudioUploadField({
  id,
  name,
  label,
  defaultValue = '',
  helper,
  tip,
}: {
  id: string
  name: string
  label: string
  defaultValue?: string
  helper?: string
  tip?: string
}) {
  const [url, setUrl] = useState(defaultValue)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [pasting, setPasting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = getSupabaseBrowser()

  async function handleFile(file: File | undefined) {
    if (!file || !supabase) return
    setError('')
    // Some browsers report an empty type for .m4a files; fall back to the extension.
    const typeOk = ACCEPTED.includes(file.type) || (!file.type && /\.(mp3|m4a|aac|wav|ogg)$/i.test(file.name))
    if (!typeOk) {
      setError('That file type is not supported. Choose an MP3, M4A, AAC, WAV, or OGG recording.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('That recording is larger than 50 MB. Export it as an MP3 at 64 to 96 kbps, which keeps an hour-long lesson well under the limit.')
      return
    }

    setUploading(true)
    const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase() : 'mp3'
    const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'sermon'
    const path = `${new Date().getFullYear()}/${Date.now()}-${base}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('sermon-audio')
      .upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type || 'audio/mpeg' })

    if (uploadError) {
      console.warn('[admin] audio upload failed:', uploadError.message)
      setError('The upload did not go through. Check your connection and try again.')
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('sermon-audio').getPublicUrl(path)
    setUrl(data.publicUrl)
    setUploading(false)
  }

  const statusId = `${id}-status`
  const helperId = helper ? `${id}-helper` : undefined
  const inputClass =
    'w-full rounded-md border border-border bg-input-bg px-4 py-3 text-ink placeholder:text-placeholder focus:border-primary-strong'

  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-2">
        <span className="font-semibold text-heading" id={`${id}-label`}>
          {label}
        </span>
        {tip ? <FieldTip id={id} label={label} tip={tip} /> : null}
      </span>

      <input type="hidden" name={name} value={url} />

      <div className="flex flex-col gap-3 rounded-md border border-border bg-input-bg p-4">
        {url ? (
          // A preview so the editor can confirm the recording before saving.
          <audio controls preload="none" src={url} className="w-full" aria-label="Preview the recording">
            <a href={url}>Download the recording</a>
          </audio>
        ) : (
          <span className="grid h-12 place-items-center rounded-md border border-dashed border-border-strong text-sm text-muted">
            No recording yet
          </span>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {supabase ? (
            <>
              <input
                ref={fileRef}
                id={id}
                type="file"
                accept={ACCEPT_ATTR}
                className="sr-only"
                aria-labelledby={`${id}-label`}
                aria-describedby={[statusId, helperId].filter(Boolean).join(' ') || undefined}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? 'Uploading…' : url ? 'Replace recording' : 'Upload an MP3'}
              </Button>
            </>
          ) : null}
          <Button type="button" variant="link" onClick={() => setPasting((v) => !v)} aria-expanded={pasting}>
            {pasting ? 'Hide link field' : 'Paste a link instead'}
          </Button>
          {url && !uploading ? (
            <Button type="button" variant="link" onClick={() => setUrl('')}>
              Remove
            </Button>
          ) : null}
        </div>

        {pasting || !supabase ? (
          <input
            id={supabase ? `${id}-link` : id}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value.trim())}
            aria-labelledby={`${id}-label`}
            placeholder="https://…/sermon.mp3"
            className={inputClass}
          />
        ) : null}

        <span id={statusId} role="status" className="max-w-full truncate text-sm text-muted">
          {uploading
            ? 'Uploading the recording. A long lesson can take a minute; keep this page open.'
            : url
              ? decodeURIComponent(url.split('/').pop() ?? '')
              : 'MP3, M4A, AAC, WAV, or OGG up to 50 MB.'}
        </span>
      </div>

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

'use client'

import { useId, useRef, useState } from 'react'
import { Avatar } from '@/components/primitives/Avatar'
import { Button } from '@/components/primitives/Button'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/**
 * Photo picker for member, family, and child photos. The file uploads to the
 * public "member-photos" bucket under a folder the storage policy allows for
 * this member; the resulting URL and a focal point travel with the form in
 * hidden inputs. The focal point is a nine-position picker (no drag and
 * zoom) so it works with one thumb and a keyboard alike.
 */
export function PhotoUploadField({
  label,
  folder,
  name = 'photo',
  positionName = 'photo_position',
  defaultUrl = '',
  defaultPosition = '50% 50%',
  previewName,
  shape = 'circle',
}: {
  label: string
  /** members/<uid>, families/<id>, children/<familyId>, events/<id> */
  folder: string
  name?: string
  positionName?: string
  defaultUrl?: string
  defaultPosition?: string
  previewName: string
  shape?: 'circle' | 'square'
}) {
  const id = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(defaultUrl)
  const [position, setPosition] = useState(defaultPosition)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError('')
    const supabase = getSupabaseBrowser()
    if (!supabase) return setError('Photo uploads are not available right now.')
    const lower = file.name.toLowerCase()
    if (/\.(heic|heif)$/.test(lower) || /hei[cf]/.test(file.type)) {
      return setError('HEIC photos are not supported. On iPhone, choose the photo again and it will convert, or pick a JPG.')
    }
    if (!ACCEPTED.includes(file.type)) return setError('Choose a JPG, PNG, WebP, or AVIF image.')
    if (file.size > MAX_BYTES) return setError('That photo is larger than 5 MB. Choose a smaller one.')

    setBusy(true)
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : file.type === 'image/avif' ? 'avif' : 'jpg'
    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('member-photos').upload(path, file, { cacheControl: '31536000', upsert: false })
    setBusy(false)
    if (uploadError) {
      console.warn('[photo] upload failed:', uploadError.message)
      return setError('The upload did not finish. Try again in a moment.')
    }
    setUrl(supabase.storage.from('member-photos').getPublicUrl(path).data.publicUrl)
    setPosition('50% 50%')
  }

  const positions: Array<{ value: string; label: string }> = [
    { value: '0% 0%', label: 'Top left' },
    { value: '50% 0%', label: 'Top' },
    { value: '100% 0%', label: 'Top right' },
    { value: '0% 50%', label: 'Left' },
    { value: '50% 50%', label: 'Center' },
    { value: '100% 50%', label: 'Right' },
    { value: '0% 100%', label: 'Bottom left' },
    { value: '50% 100%', label: 'Bottom' },
    { value: '100% 100%', label: 'Bottom right' },
  ]

  return (
    <div className="photo-upload-field flex flex-col gap-3">
      <span className="font-semibold text-heading">{label}</span>
      <input type="hidden" name={name} value={url} />
      <input type="hidden" name={positionName} value={position} />
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={previewName} photo={url || null} photoPosition={position} size="xl" shape={shape} priority />
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            id={id}
            type="file"
            accept="image/jpeg,.jpg,.jpeg,image/png,.png,image/webp,.webp,image/avif,.avif"
            className="sr-only"
            onChange={(e) => {
              void handleFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <Button type="button" variant="secondary" size="sm" loading={busy} onClick={() => fileRef.current?.click()}>
            {url ? 'Choose a different photo' : 'Choose a photo'}
          </Button>
          {url ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setUrl('')}>
              Remove photo
            </Button>
          ) : null}
          <p className="m-0 text-xs text-muted">JPG, PNG, WebP, or AVIF up to 5 MB.</p>
        </div>
      </div>
      {url ? (
        <fieldset className="border-0 p-0">
          <legend className="mb-1 text-sm font-semibold text-heading">Which part of the photo should stay in view?</legend>
          <div role="radiogroup" aria-label="Photo focal point" className="grid w-fit grid-cols-3 gap-1">
            {positions.map((p) => (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={position === p.value}
                aria-label={p.label}
                onClick={() => setPosition(p.value)}
                className={`h-8 w-8 rounded-sm border transition-colors ${position === p.value ? 'border-primary-strong bg-primary-strong' : 'border-border bg-surface hover:bg-surface-2'}`}
              />
            ))}
          </div>
        </fieldset>
      ) : null}
      {error ? (
        <p role="alert" className="m-0 text-sm font-semibold text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

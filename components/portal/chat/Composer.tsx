'use client'

/* eslint-disable @next/next/no-img-element */

import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/primitives/Button'
import { Dialog } from '@/components/primitives/Dialog'
import { CloseIcon, ImageIcon, SendIcon, SmileIcon } from '@/components/ui/icons'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { validateChatImage } from '@/lib/portal/chat'
import { sendMessageAction } from '@/app/members/chat/actions'

const EMOJIS = ['😀', '😂', '😊', '🙏', '👍', '❤️', '🎉', '🙌', '😢', '🤔', '☀️', '✅']

/**
 * Message composer. Text and an optional photo. The photo uploads to the
 * private chat bucket from the browser before the form posts; the server
 * action stores the path and the message appears through realtime. A
 * correlation id lets the composer clear only the draft that was sent.
 */
export function Composer({
  groupId,
  recipientId,
  userId,
  placeholder,
  confirmWholeCongregation = false,
}: {
  groupId?: string
  recipientId?: string
  userId: string
  placeholder: string
  confirmWholeCongregation?: boolean
}) {
  const [state, formAction, pending] = useActionState(sendMessageAction, { error: '', submissionId: '' })
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const acknowledged = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const submissionRef = useRef('')
  const sentDraft = useRef<{ id: string; body: string; hadFile: boolean } | null>(null)
  const [imagePath, setImagePath] = useState('')

  useEffect(() => {
    acknowledged.current = false
  }, [groupId, recipientId, confirmWholeCongregation])

  // Clear only what was sent; keep text typed while the request was in flight.
  useEffect(() => {
    const draft = sentDraft.current
    if (!draft || state.submissionId !== draft.id) return
    if (!state.error) {
      setBody((current) => (current === draft.body ? '' : current))
      if (draft.hadFile) clearFile()
      setImagePath('')
      acknowledged.current = false
      textRef.current?.focus({ preventScroll: true })
    }
    sentDraft.current = null
  }, [state])

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [body])

  function clearFile() {
    setFile(null)
    setDims(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    setImagePath('')
    if (fileRef.current) fileRef.current.value = ''
  }

  function pickFile(next: File | undefined) {
    if (!next) return
    const err = validateChatImage(next)
    setUploadError(err ?? '')
    if (err) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(next)
    setPreviewUrl(URL.createObjectURL(next))
    setImagePath('')
  }

  const canSend = Boolean(body.trim() || file) && !pending && !uploading

  async function prepareAndSubmit() {
    if (!canSend) return
    if (confirmWholeCongregation && !acknowledged.current) {
      setConfirmOpen(true)
      return
    }
    let path = imagePath
    if (file && !path) {
      const supabase = getSupabaseBrowser()
      if (!supabase) return setUploadError('Photos cannot be sent right now.')
      setUploading(true)
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
      const scope = groupId ? `group-${groupId}` : `direct-${recipientId}`
      path = `${userId}/${scope}/${Date.now()}-${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('chat-media').upload(path, file, { upsert: false })
      setUploading(false)
      if (error) return setUploadError('The photo did not upload. Try again.')
      setImagePath(path)
    }
    const id = crypto.randomUUID()
    submissionRef.current = id
    sentDraft.current = { id, body, hadFile: Boolean(file) }
    // Let React commit the hidden field values before the form posts.
    requestAnimationFrame(() => formRef.current?.requestSubmit())
  }

  return (
    <div className="chat-composer border-t border-border/50 bg-bg px-3 py-2 sm:px-4">
      <form
        ref={formRef}
        action={formAction}
        onSubmit={(e) => {
          // Only programmatic submits carry a submission id.
          if (!submissionRef.current) {
            e.preventDefault()
            void prepareAndSubmit()
            return
          }
          submissionRef.current = ''
        }}
        className="mx-auto flex max-w-3xl flex-col gap-2"
      >
        <input type="hidden" name="submission_id" value={sentDraft.current?.id ?? ''} />
        <input type="hidden" name="group_id" value={groupId ?? ''} />
        <input type="hidden" name="recipient_id" value={recipientId ?? ''} />
        <input type="hidden" name="image_path" value={imagePath} />
        <input type="hidden" name="image_width" value={dims?.w ?? ''} />
        <input type="hidden" name="image_height" value={dims?.h ?? ''} />

        {previewUrl ? (
          <div className="relative w-fit">
            <img
              src={previewUrl}
              alt="Photo ready to send"
              onLoad={(e) => setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              className="max-h-40 rounded-lg border border-border/60"
            />
            <button type="button" onClick={clearFile} aria-label="Remove photo" className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-surface-deep text-on-deep shadow-md">
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {showEmoji ? (
          <div role="group" aria-label="Emoji" className="flex flex-wrap gap-1 rounded-md border border-border/60 bg-surface p-2">
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setBody((b) => `${b}${e}`)} aria-label={`Insert ${e}`} className="grid h-10 w-10 place-items-center rounded-md text-xl hover:bg-bg">
                {e}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,.jpg,.jpeg,image/png,.png,image/webp,.webp"
            className="sr-only"
            id="chat-photo"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          <button type="button" onClick={() => fileRef.current?.click()} aria-label="Add a photo" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-primary-strong hover:bg-surface">
            <ImageIcon className="h-6 w-6" />
          </button>
          <button type="button" onClick={() => setShowEmoji((v) => !v)} aria-label="Add an emoji" aria-expanded={showEmoji} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-primary-strong hover:bg-surface">
            <SmileIcon className="h-6 w-6" />
          </button>
          <label htmlFor="chat-body" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-body"
            ref={textRef}
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onFocus={() => {
              if (confirmWholeCongregation && !acknowledged.current) setConfirmOpen(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void prepareAndSubmit()
              }
            }}
            rows={1}
            placeholder={placeholder}
            enterKeyHint="send"
            className="min-h-11 flex-1 resize-none rounded-2xl border border-border bg-input-bg px-4 py-2.5 text-ink placeholder:text-placeholder focus:border-primary-strong"
          />
          <button
            type="button"
            onClick={() => void prepareAndSubmit()}
            disabled={!canSend}
            aria-label="Send message"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-on-secondary shadow-sm transition-colors hover:bg-secondary-hover disabled:bg-primary-disabled disabled:text-on-primary-disabled"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
        {state.error || uploadError ? (
          <p role="alert" className="m-0 text-sm font-semibold text-error">
            {uploadError || state.error}
          </p>
        ) : null}
      </form>

      <Dialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false)
          setBody('')
          clearFile()
          textRef.current?.blur()
        }}
        title="Message the whole congregation?"
        description="Everyone with an approved account will see this. Please be mindful of what you share."
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setConfirmOpen(false)
                setBody('')
                clearFile()
                textRef.current?.blur()
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                acknowledged.current = true
                setConfirmOpen(false)
                textRef.current?.focus()
              }}
            >
              Continue
            </Button>
          </>
        }
      >
        <p className="m-0 text-sm text-muted">Announcements from the elders and the church office go out separately; this chat is for conversation.</p>
      </Dialog>
    </div>
  )
}

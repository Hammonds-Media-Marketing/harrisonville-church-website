'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/portal/data'
import { approvalFeedback, normalizeRecipientEmail, sendWelcomeEmail, takeRateLimitSlot, testEmailFeedback } from '@/lib/portal/email'
import { isUuid } from '@/lib/portal/chat'

/**
 * Admin actions for the member portal: approval with the welcome email,
 * rejection, group management, and the welcome-email test send.
 */

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim()

// ---------------------------------------------------------------------------
// Approval
// ---------------------------------------------------------------------------

export async function approveMemberAction(formData: FormData) {
  const ctx = await requireAdmin()
  const id = text(formData, 'id')
  if (!isUuid(id)) redirect('/members/admin/members?error=save')

  const { data: target } = await ctx.supabase.from('member_profiles').select('*').eq('id', id).maybeSingle()
  if (!target) redirect('/members/admin/members?error=save')

  const { error } = await ctx.supabase.from('member_profiles').update({ approved: true }).eq('id', id)
  if (error) redirect('/members/admin/members?error=save')

  // Welcome email goes out once, only on a first approval.
  let notice = 'approved'
  if (!target.approved && !target.welcome_email_sent_at) {
    const result = await sendWelcomeEmail({ email: target.email, full_name: target.full_name })
    if (result.status === 'sent') {
      await ctx.supabase.from('member_profiles').update({ welcome_email_sent_at: new Date().toISOString() }).eq('id', id).is('welcome_email_sent_at', null)
    }
    notice = `email_${result.status}`
  }
  revalidatePath('/members', 'layout')
  redirect(`/members/admin/members?notice=${notice}`)
}

export async function rejectMemberAction(formData: FormData) {
  const ctx = await requireAdmin()
  const id = text(formData, 'id')
  if (id === ctx.userId) redirect('/members/admin/members?error=self')
  const { error } = await ctx.supabase.from('member_profiles').update({ approved: false, rejected_at: new Date().toISOString() }).eq('id', id)
  if (error) redirect('/members/admin/members?error=save')
  revalidatePath('/members', 'layout')
  redirect('/members/admin/members?notice=rejected')
}

export async function resendWelcomeEmailAction(formData: FormData) {
  const ctx = await requireAdmin()
  const id = text(formData, 'id')
  const { data: target } = await ctx.supabase.from('member_profiles').select('email, full_name, approved').eq('id', id).maybeSingle()
  if (!target || !target.approved) redirect('/members/admin/members?error=save')
  if (!takeRateLimitSlot(`welcome-resend:${ctx.userId}`)) redirect('/members/admin/members?error=rate')
  const result = await sendWelcomeEmail({ email: target.email, full_name: target.full_name })
  if (result.status === 'sent') {
    await ctx.supabase.from('member_profiles').update({ welcome_email_sent_at: new Date().toISOString() }).eq('id', id)
  }
  revalidatePath('/members/admin/members')
  redirect(`/members/admin/members?notice=email_${result.status}`)
}

export async function sendTestWelcomeEmailAction(_prev: { message: string; ok: boolean }, formData: FormData) {
  const ctx = await requireAdmin()
  const email = normalizeRecipientEmail(text(formData, 'email'))
  if (!email) return { message: 'Enter one valid email address.', ok: false }
  if (!takeRateLimitSlot(`welcome-test:${ctx.userId}`)) return { message: 'Too many test emails. Wait a few minutes and try again.', ok: false }
  const result = await sendWelcomeEmail({ email, full_name: 'Test Member' })
  return { message: testEmailFeedback(result.status, email), ok: result.status === 'sent' }
}

export async function approvalNoticeText(notice: string): Promise<string> {
  if (notice.startsWith('email_')) return approvalFeedback(notice.slice(6) as Parameters<typeof approvalFeedback>[0])
  if (notice === 'rejected') return 'The request was declined. The person can still sign in, but sees only the waiting notice.'
  return 'Saved.'
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export async function createGroupAction(formData: FormData) {
  const ctx = await requireAdmin()
  const name = text(formData, 'name')
  if (!name) redirect('/members/admin/groups?error=name')
  const { data, error } = await ctx.supabase
    .from('groups')
    .insert({ name: name.slice(0, 80), description: text(formData, 'description') || null, kind: 'custom', is_public: formData.get('is_public') === 'on', created_by: ctx.userId })
    .select('id')
    .single()
  if (error || !data) redirect('/members/admin/groups?error=save')
  const memberIds = formData.getAll('member_ids').map(String).filter(isUuid)
  if (memberIds.length) {
    await ctx.supabase.from('group_members').insert(memberIds.map((member_id) => ({ group_id: data.id, member_id, added_by: ctx.userId })))
  }
  revalidatePath('/members/admin/groups')
  revalidatePath('/members/chat')
  redirect('/members/admin/groups?saved=1')
}

export async function updateGroupAction(formData: FormData) {
  const ctx = await requireAdmin()
  const id = text(formData, 'id')
  const name = text(formData, 'name')
  if (!isUuid(id) || !name) redirect('/members/admin/groups?error=name')

  const { error } = await ctx.supabase
    .from('groups')
    .update({ name: name.slice(0, 80), description: text(formData, 'description') || null, is_public: formData.get('is_public') === 'on' })
    .eq('id', id)
    .eq('kind', 'custom')
  if (error) redirect('/members/admin/groups?error=save')

  // Membership diff for private groups.
  const wanted = new Set(formData.getAll('member_ids').map(String).filter(isUuid))
  const { data: current } = await ctx.supabase.from('group_members').select('member_id').eq('group_id', id)
  const existing = new Set((current ?? []).map((m) => m.member_id))
  const toAdd = Array.from(wanted).filter((m) => !existing.has(m))
  const toRemove = Array.from(existing).filter((m) => !wanted.has(m))
  if (toAdd.length) await ctx.supabase.from('group_members').insert(toAdd.map((member_id) => ({ group_id: id, member_id, added_by: ctx.userId })))
  if (toRemove.length) await ctx.supabase.from('group_members').delete().eq('group_id', id).in('member_id', toRemove)

  revalidatePath('/members/admin/groups')
  revalidatePath('/members/chat')
  redirect('/members/admin/groups?saved=1')
}

export async function archiveGroupAction(formData: FormData) {
  const ctx = await requireAdmin()
  const id = text(formData, 'id')
  const restore = text(formData, 'restore') === '1'
  const { error } = await ctx.supabase.from('groups').update({ archived_at: restore ? null : new Date().toISOString() }).eq('id', id).eq('kind', 'custom')
  if (error) redirect('/members/admin/groups?error=save')
  revalidatePath('/members/admin/groups')
  revalidatePath('/members/chat')
  redirect('/members/admin/groups?saved=1')
}

export async function deleteGroupAction(formData: FormData) {
  const ctx = await requireAdmin()
  const id = text(formData, 'id')
  if (text(formData, 'confirmation') !== 'DELETE') redirect('/members/admin/groups?error=confirm')
  const { error } = await ctx.supabase.from('groups').delete().eq('id', id).eq('kind', 'custom')
  if (error) redirect('/members/admin/groups?error=save')
  revalidatePath('/members/admin/groups')
  revalidatePath('/members/chat')
  redirect('/members/admin/groups?deleted=1')
}

'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase-server'
import { requireApprovedMember, requireMember } from '@/lib/portal/data'
import { isValidDateKey } from '@/lib/portal/time'
import type { PlatformCategory } from '@/lib/portal/types'

/**
 * Members-area server actions: session, profile, family, children,
 * notification preferences, and installed-app detection. Every mutation runs
 * under the caller's cookie session, so Row Level Security is the
 * enforcement layer; the checks here exist to give clean redirects.
 */

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim()
const flag = (form: FormData, key: string) => form.get(key) === 'on'
const dateOrNull = (form: FormData, key: string) => {
  const v = text(form, key)
  return v && isValidDateKey(v) ? v : null
}
const genderOrNull = (form: FormData) => {
  const v = text(form, 'gender')
  return v === 'male' || v === 'female' ? v : null
}
const positionOrDefault = (form: FormData, key: string) => {
  const v = text(form, key)
  return /^\d{1,3}% \d{1,3}%$/.test(v) ? v : '50% 50%'
}

const US_STATES = new Set(
  'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(' ')
)

export async function signOutAction() {
  const supabase = await getSupabaseServer()
  if (supabase) await supabase.auth.signOut()
  redirect('/members/login')
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function updateProfileAction(formData: FormData) {
  const ctx = await requireMember()
  const fullName = text(formData, 'full_name')
  if (!fullName) redirect('/members/profile?error=name')

  const { error } = await ctx.supabase
    .from('member_profiles')
    .update({
      full_name: fullName,
      phone: text(formData, 'phone') || null,
      address: text(formData, 'address') || null,
      about: text(formData, 'about') || null,
      birthday: dateOrNull(formData, 'birthday'),
      anniversary: dateOrNull(formData, 'anniversary'),
      gender: genderOrNull(formData),
      photo: text(formData, 'photo') || null,
      photo_position: positionOrDefault(formData, 'photo_position'),
      show_in_directory: flag(formData, 'show_in_directory'),
      show_email: flag(formData, 'show_email'),
      show_phone: flag(formData, 'show_phone'),
      show_address: flag(formData, 'show_address'),
      show_birthday: flag(formData, 'show_birthday'),
      show_anniversary: flag(formData, 'show_anniversary'),
    })
    .eq('id', ctx.userId)

  if (error) {
    console.warn('[members] profile update failed:', error.message)
    redirect('/members/profile?error=save')
  }

  revalidatePath('/members', 'layout')
  redirect('/members/profile?saved=1')
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  const ctx = await requireApprovedMember()
  const { error } = await ctx.supabase.from('notification_preferences').upsert(
    {
      member_id: ctx.userId,
      direct_messages: flag(formData, 'direct_messages'),
      group_messages: flag(formData, 'group_messages'),
      announcements: flag(formData, 'announcements'),
      calendar: flag(formData, 'calendar'),
      special_events: flag(formData, 'special_events'),
      admin_new_member: ctx.isAdmin ? flag(formData, 'admin_new_member') : true,
    },
    { onConflict: 'member_id' }
  )
  if (error) redirect('/members/profile?tab=notifications&error=save')

  // Per-group toggles: every accessible group is listed; unchecked means muted.
  const groupIds = formData.getAll('group_ids').map(String)
  const enabled = new Set(formData.getAll('enabled_group_ids').map(String))
  if (groupIds.length) {
    await ctx.supabase.from('group_notification_preferences').upsert(
      groupIds.map((group_id) => ({ member_id: ctx.userId, group_id, enabled: enabled.has(group_id) })),
      { onConflict: 'member_id,group_id' }
    )
  }
  revalidatePath('/members/profile')
  redirect('/members/profile?tab=notifications&saved=1')
}

// ---------------------------------------------------------------------------
// Family
// ---------------------------------------------------------------------------

export async function createFamilyAction(formData: FormData) {
  const ctx = await requireApprovedMember()
  if (ctx.profile.family_id) redirect('/members/profile?tab=family&error=already')
  const familyName = text(formData, 'family_name')
  if (!familyName) redirect('/members/profile?tab=family&error=family_name')

  const { data, error } = await ctx.supabase
    .from('families')
    .insert({ family_name: familyName, created_by: ctx.userId })
    .select('id')
    .single()
  if (error || !data) redirect('/members/profile?tab=family&error=save')

  const { error: joinError } = await ctx.supabase.from('member_profiles').update({ family_id: data.id }).eq('id', ctx.userId)
  if (joinError) redirect('/members/profile?tab=family&error=save')

  revalidatePath('/members', 'layout')
  redirect('/members/profile?tab=family&saved=family')
}

export async function joinFamilyAction(formData: FormData) {
  const ctx = await requireApprovedMember()
  const familyId = text(formData, 'family_id')
  if (!familyId) redirect('/members/profile?tab=family&error=save')
  // Joining an existing family requires an invitation from one of its
  // members (add_member_to_family). A member may only place themself in a
  // family they created; the trigger enforces that.
  const { error } = await ctx.supabase.from('member_profiles').update({ family_id: familyId }).eq('id', ctx.userId)
  if (error) redirect('/members/profile?tab=family&error=invite')
  revalidatePath('/members', 'layout')
  redirect('/members/profile?tab=family&saved=family')
}

export async function leaveFamilyAction() {
  const ctx = await requireApprovedMember()
  await ctx.supabase.from('member_profiles').update({ family_id: null }).eq('id', ctx.userId)
  revalidatePath('/members', 'layout')
  redirect('/members/profile?tab=family&saved=left')
}

export async function addFamilyMemberAction(formData: FormData) {
  const ctx = await requireApprovedMember()
  const familyId = text(formData, 'family_id')
  const memberId = text(formData, 'member_id')
  if (!familyId || !memberId) redirect('/members/profile?tab=family&error=save')
  const { error } = await ctx.supabase.rpc('add_member_to_family', { target_family_id: familyId, target_member_id: memberId })
  if (error) redirect('/members/profile?tab=family&error=save')
  revalidatePath('/members', 'layout')
  redirect('/members/profile?tab=family&saved=member')
}

export async function updateFamilyAction(formData: FormData) {
  const ctx = await requireApprovedMember()
  const familyId = text(formData, 'family_id')
  const familyName = text(formData, 'family_name')
  const state = text(formData, 'state').toUpperCase()
  if (!familyId || !familyName) redirect('/members/profile?tab=family&error=family_name')
  if (state && !US_STATES.has(state)) redirect('/members/profile?tab=family&error=state')

  const { data, error } = await ctx.supabase
    .from('families')
    .update({
      family_name: familyName,
      photo: text(formData, 'photo') || null,
      photo_position: positionOrDefault(formData, 'photo_position'),
      address_line1: text(formData, 'address_line1').slice(0, 120) || null,
      address_line2: text(formData, 'address_line2').slice(0, 120) || null,
      city: text(formData, 'city').slice(0, 80) || null,
      state: state || null,
      postal_code: text(formData, 'postal_code').slice(0, 20) || null,
      show_address: flag(formData, 'show_address'),
    })
    .eq('id', familyId)
    .select('id')
  // An RLS-blocked update returns no rows rather than an error.
  if (error || !data?.length) redirect('/members/profile?tab=family&error=save')

  revalidatePath('/members', 'layout')
  redirect('/members/profile?tab=family&saved=family')
}

export async function saveChildAction(formData: FormData) {
  const ctx = await requireApprovedMember()
  const familyId = text(formData, 'family_id')
  const id = text(formData, 'id')
  const firstName = text(formData, 'first_name')
  if (!familyId || !firstName) redirect('/members/profile?tab=family&error=child_name')

  const values = {
    family_id: familyId,
    first_name: firstName,
    last_name: text(formData, 'last_name') || null,
    birthday: dateOrNull(formData, 'birthday'),
    gender: genderOrNull(formData),
    photo: text(formData, 'photo') || null,
    photo_position: positionOrDefault(formData, 'photo_position'),
    show_birthday: flag(formData, 'show_birthday'),
  }
  const { error } = id
    ? await ctx.supabase.from('family_children').update(values).eq('id', id).eq('family_id', familyId)
    : await ctx.supabase.from('family_children').insert({ ...values, created_by: ctx.userId })
  if (error) redirect('/members/profile?tab=family&error=save')

  revalidatePath('/members', 'layout')
  redirect('/members/profile?tab=family&saved=child')
}

export async function deleteChildAction(formData: FormData) {
  const ctx = await requireApprovedMember()
  const id = text(formData, 'id')
  const { data, error } = await ctx.supabase.from('family_children').delete().eq('id', id).select('id')
  if (error || !data?.length) redirect('/members/profile?tab=family&error=save')
  revalidatePath('/members', 'layout')
  redirect('/members/profile?tab=family&deleted=1')
}

// ---------------------------------------------------------------------------
// Installed-app detection (called from the client when running standalone)
// ---------------------------------------------------------------------------

export async function recordInstalledAppAction(input: { platformCategory: PlatformCategory; standaloneDetected: boolean }): Promise<{ ok: boolean }> {
  const ctx = await requireMember()
  if (!ctx.approved || !input.standaloneDetected) return { ok: false }
  const allowed: PlatformCategory[] = ['iOS', 'Android', 'Windows', 'macOS', 'Other']
  const platform = allowed.includes(input.platformCategory) ? input.platformCategory : 'Other'
  const now = new Date().toISOString()
  const { error } = await ctx.supabase
    .from('installed_app_detections')
    .upsert({ member_id: ctx.userId, platform_category: platform, standalone_detected: true, last_detected_at: now }, { onConflict: 'member_id' })
  return { ok: !error }
}

// ---------------------------------------------------------------------------
// Password recovery
// ---------------------------------------------------------------------------

export async function requestPasswordResetAction(_prev: { error: string; success: string }, formData: FormData) {
  const supabase = await getSupabaseServer()
  const email = text(formData, 'email').toLowerCase()
  if (!supabase) return { error: 'The members area is not connected yet.', success: '' }
  if (!email) return { error: 'Enter the email address on your member account.', success: '' }
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/members/auth/confirm?next=/members/reset-password` })
  // Same message whether or not the account exists, so addresses cannot be probed.
  return { error: '', success: 'If that address has a member account, a reset link is on its way. Check your email.' }
}

export async function updatePasswordAction(_prev: { error: string; success: string }, formData: FormData) {
  const supabase = await getSupabaseServer()
  if (!supabase) return { error: 'The members area is not connected yet.', success: '' }
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm_password') ?? '')
  if (password.length < 8) return { error: 'Use at least 8 characters.', success: '' }
  if (password !== confirm) return { error: 'The two passwords do not match.', success: '' }
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: 'That password could not be saved. Request a new reset link and try again.', success: '' }
  return { error: '', success: 'Your password has been updated.' }
}

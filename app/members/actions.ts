'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase-server'

/**
 * Members-area server actions. Every mutation runs under the caller's cookie
 * session, so Row Level Security is the enforcement layer: a member can only
 * touch their own profile, and the profile guard trigger blocks any attempt
 * to change role or approval.
 */

export async function signOutAction() {
  const supabase = await getSupabaseServer()
  if (supabase) await supabase.auth.signOut()
  redirect('/members/login')
}

export async function updateProfileAction(formData: FormData) {
  const supabase = await getSupabaseServer()
  if (!supabase) redirect('/members/profile?error=config')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/members/login')

  const text = (key: string) => String(formData.get(key) ?? '').trim()
  const flag = (key: string) => formData.get(key) === 'on'

  const { error } = await supabase
    .from('member_profiles')
    .update({
      full_name: text('full_name'),
      phone: text('phone') || null,
      address: text('address') || null,
      about: text('about') || null,
      show_in_directory: flag('show_in_directory'),
      show_email: flag('show_email'),
      show_phone: flag('show_phone'),
      show_address: flag('show_address'),
    })
    .eq('id', user.id)

  if (error) {
    console.warn('[members] profile update failed:', error.message)
    redirect('/members/profile?error=save')
  }

  revalidatePath('/members/profile')
  revalidatePath('/members/directory')
  redirect('/members/profile?saved=1')
}

import type { MemberProfileRow } from '@/lib/portal/types'

/**
 * Getting-started checklist for a newly approved member. Three essentials,
 * shown on the members home until all three are done. Nothing here blocks
 * the app; it only nudges.
 */

export type ProfileFieldCheck = { key: string; label: string; complete: boolean }

export type ProfileCompletion = {
  complete: boolean
  required: ProfileFieldCheck[]
  recommended: ProfileFieldCheck[]
}

export type OnboardingItem = {
  key: 'install' | 'profile' | 'photo'
  title: string
  description: string
  complete: boolean
  href: string
  actionLabel: string
}

export type OnboardingStatus = {
  completedCount: number
  totalCount: 3
  percentComplete: number
  isComplete: boolean
  profile: ProfileCompletion
  items: OnboardingItem[]
}

const has = (v: string | null | undefined) => Boolean(v && v.trim())

export function getProfileCompletion(profile: MemberProfileRow | null): ProfileCompletion {
  const required: ProfileFieldCheck[] = [
    { key: 'full_name', label: 'Full name', complete: has(profile?.full_name) },
    { key: 'phone', label: 'Phone', complete: has(profile?.phone) },
    { key: 'birthday', label: 'Birthday', complete: has(profile?.birthday) },
    { key: 'gender', label: 'Gender', complete: has(profile?.gender) },
  ]
  const recommended: ProfileFieldCheck[] = [
    { key: 'photo', label: 'Profile photo', complete: has(profile?.photo) },
    { key: 'family_id', label: 'Family', complete: has(profile?.family_id) },
    { key: 'anniversary', label: 'Anniversary', complete: has(profile?.anniversary) },
    { key: 'about', label: 'About', complete: has(profile?.about) },
  ]
  return { complete: required.every((f) => f.complete), required, recommended }
}

export function getOnboardingStatus(input: { profile: MemberProfileRow | null; hasInstalledApp: boolean }): OnboardingStatus {
  const profile = getProfileCompletion(input.profile)
  const items: OnboardingItem[] = [
    {
      key: 'install',
      title: 'Add the members area to your phone',
      description: input.hasInstalledApp
        ? 'The app has opened from your home screen.'
        : 'Open this page in Safari or Chrome and choose Add to Home Screen. It then opens like an app.',
      complete: input.hasInstalledApp,
      href: '/members/getting-started#install',
      actionLabel: 'How to install',
    },
    {
      key: 'profile',
      title: 'Complete your profile',
      description: profile.complete
        ? 'Your contact details, birthday, and gender are filled in.'
        : `Still needed: ${profile.required.filter((f) => !f.complete).map((f) => f.label.toLowerCase()).join(', ')}.`,
      complete: profile.complete,
      href: '/members/profile',
      actionLabel: 'Edit profile',
    },
    {
      key: 'photo',
      title: 'Add a profile photo',
      description: has(input.profile?.photo)
        ? 'The church family can put a face with your name.'
        : 'A photo helps newer members recognize you in the directory and in chat.',
      complete: has(input.profile?.photo),
      href: '/members/profile#photo',
      actionLabel: 'Add photo',
    },
  ]
  const completedCount = items.filter((i) => i.complete).length
  return {
    completedCount,
    totalCount: 3,
    percentComplete: Math.round((completedCount / 3) * 100),
    isComplete: completedCount === 3,
    profile,
    items,
  }
}

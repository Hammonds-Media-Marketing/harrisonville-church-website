import type { Gender, RsvpResponse, RsvpSummary, SpecialEventAudience } from '@/lib/portal/types'

/**
 * Pure rules for special events: who is eligible, what the RSVP summary
 * looks like, and the labels the UI shows. The database enforces the same
 * rules in is_special_event_participant; this mirror drives the form's
 * "N eligible members" counter and the tests.
 */

export const SPECIAL_EVENT_CATEGORIES = [
  { value: 'fellowship', label: 'Fellowship meal' },
  { value: 'gospel_meeting', label: 'Gospel meeting' },
  { value: 'baby_shower', label: 'Baby shower' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'meal_train', label: 'Meal train' },
  { value: 'service_project', label: 'Service project' },
  { value: 'other', label: 'Other' },
] as const

export const AUDIENCES: Array<{ value: SpecialEventAudience; label: string; helper: string }> = [
  { value: 'everyone', label: 'Everyone', helper: 'Every approved member is invited.' },
  { value: 'women', label: 'Ladies', helper: 'Members whose profile lists female.' },
  { value: 'men', label: 'Men', helper: 'Members whose profile lists male.' },
]

export const RSVP_OPTIONS: Array<{ value: RsvpResponse; label: string; helper: string }> = [
  { value: 'yes', label: 'Yes, I will be there', helper: 'Count me in.' },
  { value: 'maybe', label: 'Maybe', helper: 'I hope to make it.' },
  { value: 'no', label: 'No, I cannot make it', helper: 'Thank you for the invitation.' },
]

export function categoryLabel(value: string | null): string {
  return SPECIAL_EVENT_CATEGORIES.find((c) => c.value === value)?.label ?? 'Congregation event'
}

export function audienceLabel(value: string): string {
  return AUDIENCES.find((a) => a.value === value)?.label ?? 'Everyone'
}

export function rsvpLabel(value: string | null): string {
  if (value === 'yes') return 'Going'
  if (value === 'maybe') return 'Maybe'
  if (value === 'no') return 'Not going'
  return 'No response'
}

export function isAudienceEligible(
  member: { approved: boolean; gender: Gender | null; id: string },
  audience: SpecialEventAudience,
  excludedIds: Iterable<string> = []
): boolean {
  if (!member.approved) return false
  if (new Set(excludedIds).has(member.id)) return false
  if (audience === 'everyone') return true
  if (audience === 'women') return member.gender === 'female'
  return member.gender === 'male'
}

export function canParticipate(
  event: { status: string; archivedAt: string | null; audience: SpecialEventAudience },
  member: { approved: boolean; gender: Gender | null; id: string },
  excludedIds: Iterable<string> = []
): boolean {
  return event.status === 'published' && !event.archivedAt && isAudienceEligible(member, event.audience, excludedIds)
}

export function summarizeRsvps(invitees: Array<{ response: string | null; guest_count?: number | null }>): RsvpSummary {
  const summary: RsvpSummary = { invited: invitees.length, yes: 0, maybe: 0, no: 0, noResponse: 0, guests: 0 }
  for (const i of invitees) {
    if (i.response === 'yes') {
      summary.yes += 1
      summary.guests += Math.max(0, i.guest_count ?? 0)
    } else if (i.response === 'maybe') summary.maybe += 1
    else if (i.response === 'no') summary.no += 1
    else summary.noResponse += 1
  }
  return summary
}

const responseOrder: Record<string, number> = { yes: 0, maybe: 1, none: 2, no: 3 }

/** Going first, then maybe, then no response, then not going; names alphabetical. */
export function sortInvitees<T extends { response: string | null; full_name: string }>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => (responseOrder[a.response ?? 'none'] ?? 2) - (responseOrder[b.response ?? 'none'] ?? 2) || a.full_name.localeCompare(b.full_name)
  )
}

/** Which sections the detail page shows; the tab strip appears only with two or more. */
export function eventSections(input: { description: string; signupItemCount: number; hasChat: boolean }) {
  const sections: Array<'details' | 'signups' | 'chat'> = []
  if (input.description.trim()) sections.push('details')
  if (input.signupItemCount > 0) sections.push('signups')
  if (input.hasChat) sections.push('chat')
  return sections
}

export function shouldNotifyPublish(previousStatus: string | null, nextStatus: string): boolean {
  return nextStatus === 'published' && previousStatus !== 'published'
}

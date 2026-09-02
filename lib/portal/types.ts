import type { Database } from '@/lib/database.types'

/**
 * Member portal app types. Rows come straight from the generated database
 * types; the composite shapes below are what pages and components consume
 * after the data layer has joined and masked them.
 */

type Tables = Database['public']['Tables']

export type MemberProfileRow = Tables['member_profiles']['Row']
export type DirectoryRow = Database['public']['Views']['member_directory']['Row']
export type FamilyRow = Tables['families']['Row']
export type FamilyChildRow = Tables['family_children']['Row']
export type GroupRow = Tables['groups']['Row']
export type MessageRow = Tables['messages']['Row']
export type ReactionRow = Tables['chat_message_reactions']['Row']
export type CalendarEventRow = Tables['calendar_events']['Row']
export type SpecialEventRow = Tables['special_events']['Row']
export type SignupItemRow = Tables['special_event_signup_items']['Row']
export type SignupRow = Tables['special_event_signups']['Row']
export type RsvpRow = Tables['special_event_rsvps']['Row']
export type CommunionSignupRow = Tables['communion_signups']['Row']
export type ServiceAssignmentRow = Tables['service_assignments']['Row']
export type ServiceMonthRow = Tables['service_schedule_months']['Row']
export type NotificationRow = Tables['in_app_notifications']['Row']
export type NotificationPreferencesRow = Tables['notification_preferences']['Row']
export type InstalledAppRow = Tables['installed_app_detections']['Row']

export type Gender = 'male' | 'female'
export type MemberRole = Database['public']['Enums']['member_role']

/** Minimal person shape used by avatars, chat, RSVP lists, and pickers. */
export type PersonSummary = {
  id: string
  fullName: string
  firstName: string
  photo: string | null
  photoPosition: string
}

export type DirectoryMember = PersonSummary & {
  email: string | null
  phone: string | null
  address: string | null
  about: string | null
  birthday: string | null
  anniversary: string | null
  gender: Gender | null
  role: MemberRole
  familyId: string | null
  familyName: string | null
  lastSeenAt: string | null
}

export type DirectoryChild = {
  id: string
  familyId: string
  familyName: string
  firstName: string
  lastName: string | null
  fullName: string
  birthday: string | null
  gender: Gender | null
  photo: string | null
  photoPosition: string
}

export type DirectoryFamily = {
  id: string
  familyName: string
  photo: string | null
  photoPosition: string
  address: string[] // formatted lines, empty when hidden or blank
  members: DirectoryMember[]
  children: DirectoryChild[]
}

export type GroupKind = 'congregation' | 'men' | 'women' | 'custom' | 'event'

export type ChatReactionSummary = {
  emoji: string
  count: number
  reactedByMe: boolean
  names: string[]
}

export type ChatMessage = {
  id: string
  senderId: string
  senderName: string
  senderPhoto: string | null
  senderPhotoPosition: string
  groupId: string | null
  recipientId: string | null
  body: string
  messageType: 'text' | 'image'
  imageUrl: string | null
  imageWidth: number | null
  imageHeight: number | null
  editedAt: string | null
  deletedAt: string | null
  createdAt: string
  reactions: ChatReactionSummary[]
}

export type ChatCursor = { createdAt: string; id: string }

export type ChatPage = {
  messages: ChatMessage[]
  nextCursor: ChatCursor | null
  hasMore: boolean
}

export type ChatUnreadSummary = {
  total: number
  groups: Record<string, number>
  direct: Record<string, number>
}

export type ConversationSummary = {
  kind: 'group' | 'direct'
  id: string
  name: string
  photo: string | null
  photoPosition: string
  groupKind: GroupKind | null
  preview: string
  lastAt: string | null
  unread: number
}

export type CalendarSource = 'public' | 'members' | 'special' | 'service'

/** One occurrence on the members calendar, from any source. */
export type CalendarItem = {
  id: string
  source: CalendarSource
  title: string
  startsAt: string
  endsAt: string | null
  allDay: boolean
  category: string
  location: string | null
  description: string | null
  href: string | null
  /** Set for members-only rows so editors can open the edit form. */
  editableId: string | null
  recurring: string | null
  visibility: 'members' | 'leaders' | 'public'
}

export type SpecialEventAudience = 'everyone' | 'women' | 'men'
export type SpecialEventStatus = 'draft' | 'published'
export type RsvpResponse = 'yes' | 'maybe' | 'no'

export type RsvpSummary = {
  invited: number
  yes: number
  maybe: number
  no: number
  noResponse: number
  guests: number
}

export type InAppNotification = NotificationRow

export type PlatformCategory = 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Other'

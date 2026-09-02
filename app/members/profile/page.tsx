import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { Badge } from '@/components/primitives/Badge'
import { Avatar } from '@/components/primitives/Avatar'
import { CheckboxField, FieldShell, SelectField, TextArea, TextField } from '@/components/primitives/Field'
import { SegmentedControl, Switch } from '@/components/primitives/Controls'
import { EmptyState, Notice, ParamNotices } from '@/components/primitives/Feedback'
import { PhotoUploadField } from '@/components/portal/PhotoUploadField'
import { UsersIcon } from '@/components/ui/icons'
import { getAuthContext } from '@/lib/supabase-server'
import {
  addFamilyMemberAction,
  createFamilyAction,
  deleteChildAction,
  leaveFamilyAction,
  saveChildAction,
  updateFamilyAction,
  updateNotificationPreferencesAction,
  updateProfileAction,
} from '@/app/members/actions'
import { getAccessibleGroups, getGroupNotificationPreferences, getMembers, getMyFamily, getNotificationPreferences, requireMember } from '@/lib/portal/data'
import { getProfileCompletion } from '@/lib/portal/onboarding'
import { formatMonthDay } from '@/lib/portal/time'

export const metadata: Metadata = buildMetadata({
  title: 'My Member Profile',
  description:
    'Manage your Harrisonville Church of Christ member profile: photo, contact details, birthday and anniversary, your family and children, directory privacy, and notification settings.',
  path: '/members/profile',
  ogTitle: 'Your Member Profile',
  ogDescription: 'Contact details, family, privacy choices, and notifications.',
  noindex: true,
})

type Tab = 'profile' | 'family' | 'notifications'

const notices = {
  saved: 'Your profile has been saved.',
  'saved:family': 'Family details saved.',
  'saved:child': 'Child saved.',
  'saved:member': 'Added to your family.',
  'saved:left': 'You have left the family.',
  deleted: 'Removed.',
  'error:name': 'Please enter your full name.',
  'error:family_name': 'Give the family a name, such as "The Smith family".',
  'error:child_name': 'Enter the child’s first name.',
  'error:state': 'Use a two-letter state code, such as MO.',
  'error:already': 'You already belong to a family. Leave it first to start another.',
  'error:invite': 'Only a current member of that family can add you. Ask them to add you from their profile.',
  error: 'That did not save. Check the form and try again.',
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string; saved?: string; deleted?: string; error?: string }> }) {
  const { user } = await getAuthContext()
  if (!user) redirect('/members/login')
  const ctx = await requireMember()
  const params = await searchParams
  const tab: Tab = params.tab === 'family' || params.tab === 'notifications' ? params.tab : 'profile'
  const profile = ctx.profile
  const completion = getProfileCompletion(profile)

  return (
    <>
      <PageHero
        eyebrow="Members"
        title="My profile"
        lead="Your details, your family, and exactly what the rest of the congregation can see. Nothing here is ever public on the website."
      />

      <Section tone="light">
        <Container className="max-w-3xl">
          {ctx.approved ? (
            <div className="mb-6">
              <SegmentedControl
                label="Profile sections"
                value={tab}
                segments={[
                  { value: 'profile', label: 'Profile', href: '/members/profile' },
                  { value: 'family', label: 'Family', href: '/members/profile?tab=family' },
                  { value: 'notifications', label: 'Notifications', href: '/members/profile?tab=notifications' },
                ]}
              />
            </div>
          ) : null}

          <ParamNotices params={params} messages={notices} />

          {tab === 'profile' ? <ProfileTab ctx={ctx} completion={completion} /> : null}
          {tab === 'family' && ctx.approved ? <FamilyTab ctx={ctx} /> : null}
          {tab === 'notifications' && ctx.approved ? <NotificationsTab ctx={ctx} /> : null}
        </Container>
      </Section>
    </>
  )
}

type Ctx = Awaited<ReturnType<typeof requireMember>>

function ProfileTab({ ctx, completion }: { ctx: Ctx; completion: ReturnType<typeof getProfileCompletion> }) {
  const profile = ctx.profile
  const missing = completion.required.filter((f) => !f.complete)
  return (
    <Surface tone="card">
      {missing.length ? (
        <Notice tone="info" className="mb-5" title="A few details still help the church family">
          <p>Still blank: {missing.map((f) => f.label.toLowerCase()).join(', ')}. Gender decides which group chats and event invitations reach you.</p>
        </Notice>
      ) : null}
      <form action={updateProfileAction} className="flex flex-col gap-6" id="photo">
        <PhotoUploadField
          label="Profile photo"
          folder={`members/${ctx.userId}`}
          defaultUrl={profile.photo ?? ''}
          defaultPosition={profile.photo_position}
          previewName={profile.full_name || 'Member'}
        />

        <FieldShell id="profile-name" label="Full name" required>
          <TextField id="profile-name" name="full_name" required autoComplete="name" defaultValue={profile.full_name} />
        </FieldShell>

        <div className="flex flex-col gap-1.5">
          <span className="font-semibold text-heading">Email</span>
          <p className="m-0 rounded-md border border-border bg-surface px-4 py-3 text-muted">{profile.email}</p>
          <p className="m-0 text-sm text-muted">Sign-in email. Contact an admin to change it.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FieldShell id="profile-phone" label="Phone">
            <TextField id="profile-phone" name="phone" type="tel" autoComplete="tel" defaultValue={profile.phone ?? ''} />
          </FieldShell>
          <FieldShell id="profile-gender" label="Gender" helper="Used for the Men and Ladies chats and event invitations.">
            <SelectField
              id="profile-gender"
              name="gender"
              options={[
                { value: '', label: 'Not listed' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
              defaultValue={profile.gender ?? ''}
            />
          </FieldShell>
          <FieldShell id="profile-birthday" label="Birthday">
            <TextField id="profile-birthday" name="birthday" type="date" defaultValue={profile.birthday ?? ''} />
          </FieldShell>
          <FieldShell id="profile-anniversary" label="Wedding anniversary">
            <TextField id="profile-anniversary" name="anniversary" type="date" defaultValue={profile.anniversary ?? ''} />
          </FieldShell>
        </div>

        <FieldShell id="profile-address" label="Address" helper={profile.family_id ? 'Your family address lives on the Family tab. Use this only if it differs.' : undefined}>
          <TextField id="profile-address" name="address" autoComplete="street-address" defaultValue={profile.address ?? ''} />
        </FieldShell>

        <FieldShell id="profile-about" label="About" helper="A sentence the directory shows with your name: family, how long you have worshiped here, how you like to serve.">
          <TextArea id="profile-about" name="about" rows={3} defaultValue={profile.about ?? ''} />
        </FieldShell>

        <fieldset className="flex flex-col gap-3 rounded-md border border-border p-4">
          <legend className="px-1 font-semibold text-heading">Directory privacy</legend>
          <CheckboxField id="show-directory" name="show_in_directory" label="List me in the member directory" defaultChecked={profile.show_in_directory} />
          <CheckboxField id="show-email" name="show_email" label="Show my email to members" defaultChecked={profile.show_email} />
          <CheckboxField id="show-phone" name="show_phone" label="Show my phone number to members" defaultChecked={profile.show_phone} />
          <CheckboxField id="show-address" name="show_address" label="Show my address to members" defaultChecked={profile.show_address} />
          <CheckboxField id="show-birthday" name="show_birthday" label="Show my birthday (month and day only)" defaultChecked={profile.show_birthday} />
          <CheckboxField id="show-anniversary" name="show_anniversary" label="Show our anniversary (month and day only)" defaultChecked={profile.show_anniversary} />
        </fieldset>

        <Button type="submit" variant="primary">
          Save profile
        </Button>
      </form>
    </Surface>
  )
}

async function FamilyTab({ ctx }: { ctx: Ctx }) {
  const [mine, members] = await Promise.all([getMyFamily(ctx), getMembers()])

  if (!mine) {
    return (
      <div className="flex flex-col gap-6">
        <Surface tone="card">
          <h2 className="text-xl">Start your family</h2>
          <p className="text-muted">
            A family groups a household in the directory: one card, one address, and the children who do not have their own account. Whoever starts the family can add the other adults.
          </p>
          <form action={createFamilyAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <FieldShell id="family-name" label="Family name" required helper="For example, The Smith family.">
                <TextField id="family-name" name="family_name" required />
              </FieldShell>
            </div>
            <Button type="submit" variant="primary">
              Create family
            </Button>
          </form>
        </Surface>
        <Surface tone="panel">
          <h2 className="text-xl">Already have a family here?</h2>
          <p className="m-0 text-muted">
            Ask a family member to add you from their own Family tab. The moment they do, the family appears here.
          </p>
        </Surface>
      </div>
    )
  }

  const { family, children } = mine
  const householdIds = new Set(mine.members.map((m) => m.id))
  const addable = members.filter((m) => !m.familyId && !householdIds.has(m.id))

  return (
    <div className="flex flex-col gap-6">
      <Surface tone="card" as="section" aria-labelledby="family-details-heading">
        <h2 id="family-details-heading" className="text-xl">
          {family.family_name}
        </h2>
        <form action={updateFamilyAction} className="flex flex-col gap-5">
          <input type="hidden" name="family_id" value={family.id} />
          <PhotoUploadField
            label="Family photo"
            folder={`families/${family.id}`}
            defaultUrl={family.photo ?? ''}
            defaultPosition={family.photo_position}
            previewName={family.family_name}
            shape="square"
          />
          <FieldShell id="family-name-edit" label="Family name" required>
            <TextField id="family-name-edit" name="family_name" required defaultValue={family.family_name} />
          </FieldShell>
          <fieldset className="flex flex-col gap-4 rounded-md border border-border p-4">
            <legend className="px-1 font-semibold text-heading">Household address</legend>
            <p className="m-0 text-sm text-muted">Shared by everyone in the family. Changing it here changes it for all of you.</p>
            <FieldShell id="address1" label="Street address">
              <TextField id="address1" name="address_line1" autoComplete="address-line1" defaultValue={family.address_line1 ?? ''} />
            </FieldShell>
            <FieldShell id="address2" label="Apartment, unit, or other">
              <TextField id="address2" name="address_line2" autoComplete="address-line2" defaultValue={family.address_line2 ?? ''} />
            </FieldShell>
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
              <FieldShell id="city" label="City">
                <TextField id="city" name="city" autoComplete="address-level2" defaultValue={family.city ?? ''} />
              </FieldShell>
              <FieldShell id="state" label="State">
                <TextField id="state" name="state" autoComplete="address-level1" placeholder="MO" defaultValue={family.state ?? ''} />
              </FieldShell>
              <FieldShell id="zip" label="ZIP">
                <TextField id="zip" name="postal_code" autoComplete="postal-code" defaultValue={family.postal_code ?? ''} />
              </FieldShell>
            </div>
            <CheckboxField id="show-family-address" name="show_address" label="Show this address to members" defaultChecked={family.show_address} />
          </fieldset>
          <Button type="submit" variant="primary">
            Save family
          </Button>
        </form>
      </Surface>

      <Surface tone="card" as="section" aria-labelledby="household-heading">
        <h2 id="household-heading" className="text-xl">
          Who is in the family
        </h2>
        <ul className="m-0 flex list-none flex-col divide-y divide-border/40 p-0">
          {mine.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-3">
              <Avatar name={m.fullName} photo={m.photo} photoPosition={m.photoPosition} size="sm" />
              <span className="flex-1 font-semibold text-heading">{m.fullName}</span>
              {m.id === ctx.userId ? <Badge tone="gold">You</Badge> : <Badge tone="neutral">Adult</Badge>}
            </li>
          ))}
          {children.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
              <Avatar name={`${c.first_name} ${c.last_name ?? ''}`} photo={c.photo} photoPosition={c.photo_position} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-heading">
                  {c.first_name} {c.last_name ?? ''}
                </span>
                {c.birthday ? <span className="block text-sm text-muted">Birthday {formatMonthDay(c.birthday)}</span> : null}
              </span>
              <Badge tone="neutral">Child</Badge>
              <Link href={`/members/profile?tab=family&child=${c.id}#child-form`} className="text-sm font-semibold">
                Edit
              </Link>
              <form action={deleteChildAction}>
                <input type="hidden" name="id" value={c.id} />
                <Button type="submit" variant="ghost" size="sm" aria-label={`Remove ${c.first_name} from the family`}>
                  Remove
                </Button>
              </form>
            </li>
          ))}
        </ul>

        {addable.length ? (
          <form action={addFamilyMemberAction} className="mt-4 flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-end">
            <input type="hidden" name="family_id" value={family.id} />
            <div className="flex-1">
              <FieldShell id="add-member" label="Add an adult who already has an account">
                <SelectField id="add-member" name="member_id" options={addable.map((m) => ({ value: m.id, label: m.fullName }))} placeholder="Choose a member" />
              </FieldShell>
            </div>
            <Button type="submit" variant="secondary" size="md">
              Add to family
            </Button>
          </form>
        ) : null}
      </Surface>

      <ChildForm familyId={family.id} children={children} />

      <Surface tone="panel">
        <form action={leaveFamilyAction} className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-sm text-muted">Moved out or listed in the wrong household? You can leave this family. Children stay with the family.</p>
          <Button type="submit" variant="ghost" size="sm">
            Leave family
          </Button>
        </form>
      </Surface>
    </div>
  )
}

function ChildForm({ familyId, children }: { familyId: string; children: ChildRow[] }) {
  return (
    <Surface tone="card" as="section" aria-labelledby="child-form-heading" id="child-form">
      <h2 id="child-form-heading" className="text-xl">
        Add a child
      </h2>
      <p className="text-muted">Children appear on the family card and in the birthday list. They do not get a sign-in.</p>
      <ChildFields familyId={familyId} existing={children} />
    </Surface>
  )
}

type ChildRow = { id: string; first_name: string; last_name: string | null; birthday: string | null; gender: string | null; photo: string | null; photo_position: string; show_birthday: boolean }

function ChildFields({ familyId, existing }: { familyId: string; existing: ChildRow[] }) {
  return (
    <div className="flex flex-col gap-6">
      <form action={saveChildAction} className="flex flex-col gap-5">
        <input type="hidden" name="family_id" value={familyId} />
        <PhotoUploadField label="Photo" folder={`children/${familyId}`} previewName="Child" />
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell id="child-first" label="First name" required>
            <TextField id="child-first" name="first_name" required />
          </FieldShell>
          <FieldShell id="child-last" label="Last name">
            <TextField id="child-last" name="last_name" />
          </FieldShell>
          <FieldShell id="child-birthday" label="Birthday">
            <TextField id="child-birthday" name="birthday" type="date" />
          </FieldShell>
          <FieldShell id="child-gender" label="Gender">
            <SelectField
              id="child-gender"
              name="gender"
              options={[
                { value: '', label: 'Not listed' },
                { value: 'male', label: 'Boy' },
                { value: 'female', label: 'Girl' },
              ]}
              defaultValue=""
            />
          </FieldShell>
        </div>
        <CheckboxField id="child-show-birthday" name="show_birthday" label="Show the birthday to members (month and day only)" defaultChecked />
        <Button type="submit" variant="secondary">
          Add child
        </Button>
      </form>

      {existing.length ? (
        <details className="rounded-md border border-border p-4">
          <summary className="cursor-pointer font-semibold text-heading">Edit a child</summary>
          <div className="mt-4 flex flex-col gap-6">
            {existing.map((c) => (
              <form key={c.id} action={saveChildAction} className="flex flex-col gap-4 border-t border-border/40 pt-4 first:border-0 first:pt-0">
                <input type="hidden" name="family_id" value={familyId} />
                <input type="hidden" name="id" value={c.id} />
                <PhotoUploadField label={`${c.first_name}’s photo`} folder={`children/${familyId}`} defaultUrl={c.photo ?? ''} defaultPosition={c.photo_position} previewName={c.first_name} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldShell id={`edit-first-${c.id}`} label="First name" required>
                    <TextField id={`edit-first-${c.id}`} name="first_name" required defaultValue={c.first_name} />
                  </FieldShell>
                  <FieldShell id={`edit-last-${c.id}`} label="Last name">
                    <TextField id={`edit-last-${c.id}`} name="last_name" defaultValue={c.last_name ?? ''} />
                  </FieldShell>
                  <FieldShell id={`edit-birthday-${c.id}`} label="Birthday">
                    <TextField id={`edit-birthday-${c.id}`} name="birthday" type="date" defaultValue={c.birthday ?? ''} />
                  </FieldShell>
                  <FieldShell id={`edit-gender-${c.id}`} label="Gender">
                    <SelectField
                      id={`edit-gender-${c.id}`}
                      name="gender"
                      options={[
                        { value: '', label: 'Not listed' },
                        { value: 'male', label: 'Boy' },
                        { value: 'female', label: 'Girl' },
                      ]}
                      defaultValue={c.gender ?? ''}
                    />
                  </FieldShell>
                </div>
                <CheckboxField id={`edit-show-${c.id}`} name="show_birthday" label="Show the birthday to members" defaultChecked={c.show_birthday} />
                <div>
                  <Button type="submit" variant="secondary" size="sm">
                    Save {c.first_name}
                  </Button>
                </div>
              </form>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  )
}

async function NotificationsTab({ ctx }: { ctx: Ctx }) {
  const [prefs, groups, groupPrefs] = await Promise.all([getNotificationPreferences(ctx), getAccessibleGroups(ctx), getGroupNotificationPreferences(ctx)])
  return (
    <Surface tone="card">
      <h2 className="text-xl">Notification bell</h2>
      <p className="text-muted">
        These control what shows up under the bell in the members area. Turning something off here never hides it from the page itself.
      </p>
      <form action={updateNotificationPreferencesAction} className="flex flex-col gap-2">
        <div className="divide-y divide-border/40">
          <Switch id="pref-dm" name="direct_messages" label="Direct messages" helper="Someone sends you a message." defaultChecked={prefs.direct_messages} />
          <Switch id="pref-group" name="group_messages" label="Group chat" helper="New messages in a group you belong to. Mute individual groups below." defaultChecked={prefs.group_messages} />
          <Switch id="pref-ann" name="announcements" label="Announcements" helper="News posted by the elders or the church office." defaultChecked={prefs.announcements} />
          <Switch id="pref-cal" name="calendar" label="Calendar additions" helper="Something new goes on the members calendar." defaultChecked={prefs.calendar} />
          <Switch id="pref-events" name="special_events" label="Events and sign-ups" helper="Invitations, updates, and RSVPs on events you organize." defaultChecked={prefs.special_events} />
          {ctx.isAdmin ? (
            <Switch id="pref-admin" name="admin_new_member" label="New member requests" helper="Someone requests access and is waiting for approval." defaultChecked={prefs.admin_new_member} />
          ) : null}
        </div>

        {groups.length ? (
          <fieldset className="mt-4 flex flex-col rounded-md border border-border p-4">
            <legend className="px-1 font-semibold text-heading">Group chats</legend>
            <p className="m-0 mb-2 text-sm text-muted">Unchecked groups stay quiet in the bell. You can still read them any time.</p>
            {groups.map((g) => (
              <div key={g.id}>
                <input type="hidden" name="group_ids" value={g.id} />
                <CheckboxField id={`group-${g.id}`} name="enabled_group_ids" label={g.name} defaultChecked={groupPrefs.get(g.id) ?? true} />
              </div>
            ))}
          </fieldset>
        ) : (
          <EmptyState icon={<UsersIcon className="h-6 w-6" />} title="No group chats yet" className="mt-4" />
        )}

        <div className="mt-4">
          <Button type="submit" variant="primary">
            Save notification settings
          </Button>
        </div>
      </form>
    </Surface>
  )
}

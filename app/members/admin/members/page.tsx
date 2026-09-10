import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { formatDate } from '@/lib/format'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { Avatar } from '@/components/primitives/Avatar'
import { CheckboxField, SelectField } from '@/components/primitives/Field'
import { EmptyState, Notice, ParamNotices, StatTile } from '@/components/primitives/Feedback'
import { UsersIcon } from '@/components/ui/icons'
import { getAuthContext, isAdminRole } from '@/lib/supabase-server'
import { getAllProfiles, requireAdmin } from '@/lib/portal/data'
import { approvalFeedback } from '@/lib/portal/email'
import { removeMemberAction, setMemberStatusAction } from '@/app/members/admin/actions'
import { approveMemberAction, rejectMemberAction, resendWelcomeEmailAction } from '@/app/members/admin/portal-actions'
import { formatRelative } from '@/lib/portal/time'

export const metadata: Metadata = buildMetadata({
  title: 'Manage Members',
  description: 'Approve member access requests, set roles, resend the welcome email, and remove accounts for the Harrisonville Church of Christ members area.',
  path: '/members/admin/members',
  ogTitle: 'Member Management',
  ogDescription: 'Approve requests, set roles, and manage accounts.',
  noindex: true,
})

const ROLES = ['member', 'editor', 'admin']

export default async function AdminMembersPage({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string; error?: string; notice?: string; filter?: string }> }) {
  const { profile } = await getAuthContext()
  if (!isAdminRole(profile)) redirect('/members/admin')
  const ctx = await requireAdmin()
  const params = await searchParams
  const profiles = await getAllProfiles(ctx)

  const pending = profiles.filter((p) => !p.approved && !p.rejected_at)
  const declined = profiles.filter((p) => !p.approved && p.rejected_at)
  const approved = profiles.filter((p) => p.approved)
  const filter = params.filter === 'declined' ? 'declined' : 'approved'

  const noticeText = params.notice
    ? params.notice.startsWith('email_')
      ? approvalFeedback(params.notice.slice(6) as Parameters<typeof approvalFeedback>[0])
      : params.notice === 'rejected'
        ? 'The request was declined. The person can still sign in, but sees only a notice.'
        : 'Saved.'
    : null

  return (
    <>
      <PageHero eyebrow="Site admin" title="Members" lead="Approve access requests, set roles, and manage accounts. Editors manage content and the calendar; admins also manage members and groups." />
      <Section tone="light">
        <Container className="max-w-4xl">
          {noticeText ? <Notice tone="success" className="mb-5">{noticeText}</Notice> : null}
          <ParamNotices params={params} messages={{ 'error:self': 'You cannot remove, decline, or demote your own admin account.', 'error:rate': 'Too many emails in a short time. Wait a few minutes.', deleted: 'The account was removed.' }} />

          <div className="mb-8 grid grid-cols-3 gap-3">
            <StatTile label="Waiting" value={pending.length} tone={pending.length ? 'gold' : 'default'} />
            <StatTile label="Approved" value={approved.length} tone="primary" />
            <StatTile label="Declined" value={declined.length} />
          </div>

          <section aria-labelledby="pending-heading" className="mb-10">
            <SectionHeading eyebrow="Needs a decision" title="Access requests" id="pending-heading" lead={pending.length ? 'Approving sends the welcome email and opens the members area.' : 'No one is waiting.'} />
            {pending.length ? (
              <ul className="flex list-none flex-col gap-4 p-0">
                {pending.map((m) => (
                  <li key={m.id} id={`member-${m.id}`}>
                    <Surface tone="card" as="article" className="flex flex-wrap items-center gap-4">
                      <Avatar name={m.full_name || m.email} photo={m.photo} photoPosition={m.photo_position} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="m-0 font-semibold text-heading">{m.full_name || 'Name not provided'}</p>
                        <p className="m-0 text-sm text-muted">
                          {m.email} · requested {formatRelative(m.created_at)}
                        </p>
                      </div>
                      <form action={approveMemberAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <Button type="submit" variant="primary" size="sm">
                          Approve
                        </Button>
                      </form>
                      <form action={rejectMemberAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Decline
                        </Button>
                      </form>
                    </Surface>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<UsersIcon className="h-6 w-6" />} title="Every request has been reviewed" />
            )}
          </section>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <SectionHeading eyebrow="Congregation" title={filter === 'declined' ? `${declined.length} declined` : `${approved.length} approved account${approved.length === 1 ? '' : 's'}`} />
            <nav aria-label="Account filter" className="flex gap-2">
              <Button href="/members/admin/members" variant={filter === 'approved' ? 'secondary' : 'ghost'} size="sm">
                Approved
              </Button>
              <Button href="/members/admin/members?filter=declined" variant={filter === 'declined' ? 'secondary' : 'ghost'} size="sm">
                Declined
              </Button>
            </nav>
          </div>

          <ul className="flex list-none flex-col gap-4 p-0">
            {(filter === 'declined' ? declined : approved).map((m) => (
              <li key={m.id} id={`member-${m.id}`}>
                <Surface tone="card" as="article">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <Avatar name={m.full_name || m.email} photo={m.photo} photoPosition={m.photo_position} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="m-0 font-semibold text-heading">
                        {m.full_name || 'Name not provided'} <span className="font-normal text-muted">&lt;{m.email}&gt;</span>
                      </p>
                      <p className="m-0 text-xs text-muted">
                        Joined {formatDate(m.created_at)}
                        {m.last_seen_at ? ` · last seen ${formatRelative(m.last_seen_at)}` : ' · has not signed in since approval'}
                        {m.welcome_email_sent_at ? ' · welcome email sent' : ''}
                      </p>
                    </div>
                    <Badge tone="neutral">{m.role}</Badge>
                    {m.id === ctx.userId ? <Badge tone="gold">You</Badge> : null}
                    {!m.phone || !m.birthday || !m.gender ? <Badge tone="sample">Profile incomplete</Badge> : null}
                  </div>
                  <div className="flex flex-wrap items-end gap-4">
                    <form action={setMemberStatusAction} className="flex flex-wrap items-end gap-4">
                      <input type="hidden" name="id" value={m.id} />
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor={`role-${m.id}`} className="text-sm font-semibold text-heading">
                          Role
                        </label>
                        <SelectField id={`role-${m.id}`} name="role" options={ROLES} defaultValue={m.role} required />
                      </div>
                      <CheckboxField id={`approved-${m.id}`} name="approved" label="Approved" defaultChecked={m.approved} />
                      <Button type="submit" variant="secondary" size="sm">
                        Save
                      </Button>
                    </form>
                    {m.approved ? (
                      <form action={resendWelcomeEmailAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          {m.welcome_email_sent_at ? 'Resend welcome email' : 'Send welcome email'}
                        </Button>
                      </form>
                    ) : null}
                    {m.id !== ctx.userId ? (
                      <form action={removeMemberAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Remove
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </Surface>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  )
}

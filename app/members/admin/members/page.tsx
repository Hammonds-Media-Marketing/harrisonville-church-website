import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { formatDate } from '@/lib/format'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { CheckboxField, SelectField } from '@/components/primitives/Field'
import { AdminNotices } from '@/components/members/AdminNotices'
import { getSupabaseServer, getAuthContext, isAdminRole } from '@/lib/supabase-server'
import { removeMemberAction, setMemberStatusAction } from '@/app/members/admin/actions'

export const metadata: Metadata = buildMetadata({
  title: 'Manage Members',
  description: 'Approve member access requests and manage roles for the Harrisonville Church of Christ members area.',
  path: '/members/admin/members',
  ogTitle: 'Member Management',
  ogDescription: 'Approve access requests and manage member roles.',
  noindex: true,
})

const ROLES = ['member', 'editor', 'admin']

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>
}) {
  const { user, profile } = await getAuthContext()
  if (!isAdminRole(profile)) redirect('/members/admin')

  const supabase = await getSupabaseServer()
  const { data } = supabase
    ? await supabase
        .from('member_profiles')
        .select('*')
        .order('approved', { ascending: true })
        .order('created_at', { ascending: false })
    : { data: null }
  const members = data ?? []
  const pending = members.filter((m) => !m.approved).length
  const params = await searchParams

  return (
    <>
      <PageHero
        eyebrow="Site admin"
        title="Members"
        lead="Approve access requests, set roles, and remove accounts. Editors can manage site content; admins can also manage members."
      />

      <Section tone="light">
        <Container className="max-w-4xl">
          <AdminNotices params={params} />
          <SectionHeading
            eyebrow="Congregation"
            title={`${members.length} account${members.length === 1 ? '' : 's'}`}
            lead={pending ? `${pending} awaiting approval.` : 'No requests are waiting.'}
          />

          <ul className="flex list-none flex-col gap-4 p-0">
            {members.map((m) => (
              <li key={m.id}>
                <Surface tone="card" as="article">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {m.approved ? <Badge tone="primary">Approved</Badge> : <Badge tone="sample">Awaiting approval</Badge>}
                    <Badge tone="neutral">{m.role}</Badge>
                    {m.id === user?.id ? <Badge tone="gold">You</Badge> : null}
                    <span className="text-sm text-muted">Requested {formatDate(m.created_at)}</span>
                  </div>
                  <p className="mb-3 font-semibold text-heading">
                    {m.full_name || 'Name not provided'}{' '}
                    <span className="font-normal text-muted">&lt;{m.email}&gt;</span>
                  </p>

                  <div className="flex flex-wrap items-end gap-4">
                    <form action={setMemberStatusAction} className="flex flex-wrap items-end gap-4">
                      <input type="hidden" name="id" value={m.id} />
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor={`role-${m.id}`} className="text-sm font-semibold text-heading">
                          Role
                        </label>
                        <SelectField id={`role-${m.id}`} name="role" options={ROLES} defaultValue={m.role} required />
                      </div>
                      <CheckboxField
                        id={`approved-${m.id}`}
                        name="approved"
                        label="Approved"
                        defaultChecked={m.approved}
                      />
                      <Button type="submit" variant="secondary" size="sm">
                        Save
                      </Button>
                    </form>
                    {m.id !== user?.id ? (
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

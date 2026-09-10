import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { CheckboxField, FieldShell, TextArea, TextField } from '@/components/primitives/Field'
import { ParamNotices } from '@/components/primitives/Feedback'
import { getAuthContext, isAdminRole } from '@/lib/supabase-server'
import { getGroupsAdmin, getMembers, requireAdmin } from '@/lib/portal/data'
import { archiveGroupAction, createGroupAction, deleteGroupAction, updateGroupAction } from '@/app/members/admin/portal-actions'

export const metadata: Metadata = buildMetadata({
  title: 'Manage Group Chats',
  description: 'Create and manage group chats for the Harrisonville Church of Christ members area: who belongs, which are open to everyone, and which are archived.',
  path: '/members/admin/groups',
  ogTitle: 'Group Chat Administration',
  ogDescription: 'Set up groups and choose who belongs.',
  noindex: true,
})

const kindLabel: Record<string, string> = {
  congregation: 'Every approved member, automatically',
  men: 'Members whose profile lists male, automatically',
  women: 'Members whose profile lists female, automatically',
}

export default async function AdminGroupsPage({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string; error?: string }> }) {
  const { profile } = await getAuthContext()
  if (!isAdminRole(profile)) redirect('/members/admin')
  const ctx = await requireAdmin()
  const params = await searchParams
  const [groups, members] = await Promise.all([getGroupsAdmin(ctx), getMembers()])
  const system = groups.filter((g) => g.kind !== 'custom')
  const custom = groups.filter((g) => g.kind === 'custom')
  const noGender = members.filter((m) => !m.gender)

  return (
    <>
      <PageHero eyebrow="Site admin" title="Group chats" lead="The Congregation, Men, and Ladies chats manage themselves from each profile. Add groups here for classes, committees, or leadership, and choose who belongs." />
      <Section tone="light">
        <Container className="max-w-4xl">
          <ParamNotices params={params} messages={{ 'error:name': 'Give the group a name.', 'error:confirm': 'Type DELETE GROUP exactly to remove a group and all of its messages.', deleted: 'The group and its messages were deleted.' }} />

          <SectionHeading eyebrow="Automatic" title="Standing chats" lead={noGender.length ? `${noGender.length} approved member${noGender.length === 1 ? ' has' : 's have'} no gender on their profile and cannot see the Men or Ladies chat yet.` : undefined} />
          <ul className="mb-10 grid list-none gap-4 p-0 sm:grid-cols-3">
            {system.map((g) => (
              <li key={g.id}>
                <Surface tone="panel" className="h-full">
                  <h3 className="m-0 text-lg">{g.name}</h3>
                  <p className="m-0 mt-1 text-sm text-muted">{kindLabel[g.kind]}</p>
                </Surface>
              </li>
            ))}
          </ul>

          <SectionHeading eyebrow="Custom" title={`${custom.length} group${custom.length === 1 ? '' : 's'}`} />
          <ul className="mb-10 flex list-none flex-col gap-4 p-0">
            {custom.map((g) => (
              <li key={g.id}>
                <Surface tone="card" as="article">
                  <form action={updateGroupAction} className="flex flex-col gap-4">
                    <input type="hidden" name="id" value={g.id} />
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="m-0 text-xl">{g.name}</h3>
                      {g.archived_at ? <Badge tone="sample">Archived</Badge> : null}
                      <Badge tone={g.is_public ? 'primary' : 'neutral'}>{g.is_public ? 'Open to all members' : `${g.members.length} member${g.members.length === 1 ? '' : 's'}`}</Badge>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldShell id={`name-${g.id}`} label="Name" required>
                        <TextField id={`name-${g.id}`} name="name" required defaultValue={g.name} />
                      </FieldShell>
                      <FieldShell id={`desc-${g.id}`} label="Description">
                        <TextField id={`desc-${g.id}`} name="description" defaultValue={g.description ?? ''} />
                      </FieldShell>
                    </div>
                    <CheckboxField id={`public-${g.id}`} name="is_public" label="Open to every approved member" helper="Unchecked means only the people picked below can see it." defaultChecked={g.is_public} />
                    <details className="rounded-md border border-border p-4" open={!g.is_public && g.members.length === 0}>
                      <summary className="cursor-pointer font-semibold text-heading">Members ({g.members.length})</summary>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {members.map((m) => (
                          <CheckboxField key={m.id} id={`gm-${g.id}-${m.id}`} name="member_ids" label={m.fullName} defaultChecked={g.members.some((x) => x.id === m.id)} />
                        ))}
                      </div>
                    </details>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" variant="secondary" size="sm">
                        Save group
                      </Button>
                    </div>
                  </form>
                  <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-border/50 pt-4">
                    <form action={archiveGroupAction}>
                      <input type="hidden" name="id" value={g.id} />
                      {g.archived_at ? <input type="hidden" name="restore" value="1" /> : null}
                      <Button type="submit" variant="ghost" size="sm">
                        {g.archived_at ? 'Restore group' : 'Archive group'}
                      </Button>
                    </form>
                    <form action={deleteGroupAction} className="flex items-end gap-2">
                      <input type="hidden" name="id" value={g.id} />
                      <FieldShell id={`confirm-${g.id}`} label="Type DELETE GROUP to remove it and every message">
                        <TextField id={`confirm-${g.id}`} name="confirmation" />
                      </FieldShell>
                      <Button type="submit" variant="ghost" size="sm">
                        Delete
                      </Button>
                    </form>
                  </div>
                </Surface>
              </li>
            ))}
          </ul>

          <Surface tone="card" as="section" aria-labelledby="new-group-heading">
            <h2 id="new-group-heading" className="text-xl">
              Add a group
            </h2>
            <form action={createGroupAction} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldShell id="new-name" label="Name" required>
                  <TextField id="new-name" name="name" required placeholder="Elders, Ladies class, Youth parents" />
                </FieldShell>
                <FieldShell id="new-desc" label="Description">
                  <TextArea id="new-desc" name="description" rows={1} />
                </FieldShell>
              </div>
              <CheckboxField id="new-public" name="is_public" label="Open to every approved member" helper="Leave unchecked for a private group and pick members below." />
              <details className="rounded-md border border-border p-4">
                <summary className="cursor-pointer font-semibold text-heading">Pick members</summary>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {members.map((m) => (
                    <CheckboxField key={m.id} id={`new-gm-${m.id}`} name="member_ids" label={m.fullName} />
                  ))}
                </div>
              </details>
              <div>
                <Button type="submit" variant="primary">
                  Create group
                </Button>
              </div>
            </form>
          </Surface>
        </Container>
      </Section>
    </>
  )
}

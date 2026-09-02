import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { Avatar, AvatarStack } from '@/components/primitives/Avatar'
import { SegmentedControl } from '@/components/primitives/Controls'
import { EmptyState } from '@/components/primitives/Feedback'
import { HomeIcon, SearchIcon, UsersIcon } from '@/components/ui/icons'
import { getFamilies, getMembers, requireApprovedMember } from '@/lib/portal/data'

export const metadata: Metadata = buildMetadata({
  title: 'Member Directory',
  description:
    'The Harrisonville Church of Christ member directory: families and individual members, with the contact details each person has chosen to share with the church family.',
  path: '/members/directory',
  ogTitle: 'Church Family Directory',
  ogDescription: 'Browse by family or by person. Each member chooses what appears.',
  noindex: true,
})

type View = 'family' | 'person'

function matches(haystack: Array<string | null | undefined>, q: string): boolean {
  if (!q) return true
  const needle = q.toLowerCase()
  return haystack.some((h) => h && h.toLowerCase().includes(needle))
}

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<{ view?: string; q?: string }> }) {
  await requireApprovedMember()
  const params = await searchParams
  const view: View = params.view === 'person' ? 'person' : 'family'
  const q = (params.q ?? '').trim()

  const [members, families] = await Promise.all([getMembers({ listedOnly: true }), getFamilies()])
  const listedIds = new Set(members.map((m) => m.id))

  const people = members.filter((m) => matches([m.fullName, m.email, m.phone, m.familyName, m.about], q))
  const familyCards = families
    .map((f) => ({ ...f, members: f.members.filter((m) => listedIds.has(m.id)) }))
    .filter((f) => f.members.length || f.children.length)
    .filter((f) => matches([f.familyName, ...f.members.map((m) => m.fullName), ...f.children.map((c) => c.fullName)], q))
  const soloMembers = people.filter((m) => !m.familyId)

  return (
    <>
      <PageHero
        eyebrow="Members"
        title="Member directory"
        lead="Each member chooses what appears here. Update what you share from your profile page."
      >
        <div className="flex flex-wrap gap-2">
          <Button href="/members/directory/birthdays-anniversaries" variant="ghost" size="sm">
            Birthdays and anniversaries
          </Button>
          <Button href="/members/profile" variant="ghost" size="sm">
            Edit my profile
          </Button>
        </div>
      </PageHero>

      <Section tone="light">
        <Container>
          <form method="get" className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center" role="search">
            <input type="hidden" name="view" value={view} />
            <label htmlFor="directory-search" className="sr-only">
              Search the directory
            </label>
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                id="directory-search"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Search by name, family, email, or phone"
                className="w-full rounded-full border border-border bg-input-bg py-3 pl-12 pr-4 text-ink placeholder:text-placeholder focus:border-primary-strong"
              />
            </div>
            <SegmentedControl
              label="Directory view"
              value={view}
              segments={[
                { value: 'family', label: 'By family', href: `/members/directory?view=family${q ? `&q=${encodeURIComponent(q)}` : ''}` },
                { value: 'person', label: 'By person', href: `/members/directory?view=person${q ? `&q=${encodeURIComponent(q)}` : ''}` },
              ]}
            />
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>

          {view === 'person' ? (
            <>
              <SectionHeading eyebrow="Church family" title={`${people.length} listed member${people.length === 1 ? '' : 's'}`} />
              {people.length ? (
                <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
                  {people.map((m) => (
                    <li key={m.id}>
                      <Link
                        href={`/members/directory/${m.id}`}
                        className="flex items-center gap-3 rounded-lg border border-border-strong/40 bg-bg p-3 no-underline shadow-sm transition-shadow hover:shadow-md"
                      >
                        <Avatar name={m.fullName} photo={m.photo} photoPosition={m.photoPosition} size="md" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-heading">{m.fullName}</span>
                          <span className="block truncate text-sm text-muted">{m.familyName ? `${m.familyName}` : 'No family listed'}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={<UsersIcon className="h-6 w-6" />} title={q ? 'No one matches that search' : 'The directory is empty so far'}>
                  <p>{q ? 'Try a shorter name, or switch to the family view.' : 'As members are approved and choose to be listed, they will appear here.'}</p>
                </EmptyState>
              )}
            </>
          ) : (
            <>
              <SectionHeading eyebrow="Church family" title={`${familyCards.length} famil${familyCards.length === 1 ? 'y' : 'ies'}`} />
              {familyCards.length ? (
                <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                  {familyCards.map((f) => {
                    const people = [...f.members.map((m) => ({ id: m.id, name: m.fullName, photo: m.photo, photoPosition: m.photoPosition })), ...f.children.map((c) => ({ id: c.id, name: c.fullName, photo: c.photo, photoPosition: c.photoPosition }))]
                    return (
                      <li key={f.id}>
                        <Surface tone="card" interactive className="flex h-full flex-col gap-3">
                          <div className="flex items-center gap-3">
                            {f.photo ? (
                              <Avatar name={f.familyName} photo={f.photo} photoPosition={f.photoPosition} size="lg" shape="square" />
                            ) : (
                              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-surface text-primary-strong">
                                <HomeIcon className="h-8 w-8" />
                              </span>
                            )}
                            <div className="min-w-0">
                              <h3 className="m-0 text-xl">
                                <Link href={`/members/directory/family/${f.id}`} className="no-underline text-heading after:absolute after:inset-0">
                                  {f.familyName}
                                </Link>
                              </h3>
                              <p className="m-0 text-sm text-muted">
                                {people.length} {people.length === 1 ? 'person' : 'people'}
                              </p>
                            </div>
                          </div>
                          <AvatarStack people={people} />
                        </Surface>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <EmptyState icon={<HomeIcon className="h-6 w-6" />} title={q ? 'No family matches that search' : 'No families yet'}>
                  <p>{q ? 'Try the person view instead.' : 'Members create their family from the Family tab on their profile.'}</p>
                </EmptyState>
              )}

              {soloMembers.length ? (
                <div className="mt-8">
                  <SectionHeading title="Members without a family listed" />
                  <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
                    {soloMembers.map((m) => (
                      <li key={m.id}>
                        <Link href={`/members/directory/${m.id}`} className="flex items-center gap-3 rounded-lg border border-border-strong/40 bg-bg p-3 no-underline shadow-sm hover:shadow-md">
                          <Avatar name={m.fullName} photo={m.photo} photoPosition={m.photoPosition} size="md" />
                          <span className="truncate font-semibold text-heading">{m.fullName}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </Container>
      </Section>
    </>
  )
}

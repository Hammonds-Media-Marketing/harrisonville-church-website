import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { getSupabaseServer, getAuthContext, isAdminRole } from '@/lib/supabase-server'

export const metadata: Metadata = buildMetadata({
  title: 'Site Admin',
  description:
    'Content management for the Harrisonville Church of Christ website: events, sermons, articles, announcements, and members.',
  path: '/members/admin',
  ogTitle: 'Website Administration',
  ogDescription: 'Manage events, sermons, articles, announcements, and members.',
  noindex: true,
})

async function count(table: 'events' | 'sermons' | 'blog_posts' | 'announcements'): Promise<number> {
  const supabase = await getSupabaseServer()
  if (!supabase) return 0
  const { count: n } = await supabase.from(table).select('id', { count: 'exact', head: true })
  return n ?? 0
}

export default async function AdminOverviewPage() {
  const { profile } = await getAuthContext()
  const supabase = await getSupabaseServer()

  const [events, sermons, articles, announcements] = await Promise.all([
    count('events'),
    count('sermons'),
    count('blog_posts'),
    count('announcements'),
  ])

  let pendingComments = 0
  if (supabase) {
    const { count: n } = await supabase
      .from('blog_comments')
      .select('id', { count: 'exact', head: true })
      .eq('approved', false)
    pendingComments = n ?? 0
  }

  let pendingMembers = 0
  if (supabase && isAdminRole(profile)) {
    const { count: n } = await supabase
      .from('member_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('approved', false)
    pendingMembers = n ?? 0
  }

  const tiles = [
    { label: 'Events', value: events, href: '/members/admin/events', cta: 'Manage events' },
    { label: 'Sermons', value: sermons, href: '/members/admin/sermons', cta: 'Manage sermons' },
    { label: 'Articles', value: articles, href: '/members/admin/articles', cta: 'Manage articles' },
    { label: 'Announcements', value: announcements, href: '/members/admin/announcements', cta: 'Manage announcements' },
    { label: 'Comments awaiting review', value: pendingComments, href: '/members/admin/comments', cta: 'Moderate comments' },
    ...(isAdminRole(profile)
      ? [{ label: 'Members awaiting approval', value: pendingMembers, href: '/members/admin/members', cta: 'Manage members' }]
      : []),
  ]

  return (
    <>
      <PageHero
        eyebrow="Site admin"
        title="Manage the website"
        lead="Everything the congregation publishes lives here. Public changes go live within the hour; announcements reach members immediately."
      />

      <Section tone="light">
        <Container>
          <SectionHeading eyebrow="At a glance" title="What is on the site right now" />
          <ul className="grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map((t) => (
              <li key={t.href + t.label}>
                <Surface tone="card" className="flex h-full flex-col gap-2">
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted">{t.label}</p>
                  <p className="font-display text-4xl text-heading">{t.value}</p>
                  <div className="mt-auto pt-2">
                    <Button href={t.href} variant="ghost" size="sm">
                      {t.cta}
                    </Button>
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

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { MailIcon, MapPinIcon, PhoneIcon } from '@/components/ui/icons'
import { getAuthContext } from '@/lib/supabase-server'
import { getDirectory } from '@/lib/members'

export const metadata: Metadata = buildMetadata({
  title: 'Member Directory',
  description:
    'The Harrisonville Church of Christ member directory: contact details the church family has chosen to share with one another.',
  path: '/members/directory',
  ogTitle: 'Church Family Directory',
  ogDescription: 'Contact details members share with one another.',
  noindex: true,
})

export default async function DirectoryPage() {
  const { user, profile } = await getAuthContext()
  if (!user) redirect('/members/login')
  if (!profile?.approved) redirect('/members')

  const entries = await getDirectory()

  return (
    <>
      <PageHero
        eyebrow="Members"
        title="Member directory"
        lead="Each member chooses what appears here. Update what you share from your profile page."
      />

      <Section tone="light">
        <Container>
          <SectionHeading eyebrow="Church family" title={`${entries.length} listed member${entries.length === 1 ? '' : 's'}`} />
          {entries.length ? (
            <ul className="grid list-none gap-5 p-0 md:grid-cols-2 lg:grid-cols-3">
              {entries.map((m) => (
                <li key={m.id}>
                  <Surface tone="card" as="article" className="flex h-full flex-col gap-2">
                    <h3 className="text-xl">{m.fullName}</h3>
                    {m.about ? <p className="text-muted">{m.about}</p> : null}
                    <ul className="mt-auto flex list-none flex-col gap-1.5 p-0 pt-2">
                      {m.email ? (
                        <li>
                          <a href={`mailto:${m.email}`} className="flex items-center gap-2 text-link hover:text-link-hover">
                            <MailIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span className="break-all">{m.email}</span>
                          </a>
                        </li>
                      ) : null}
                      {m.phone ? (
                        <li>
                          <a href={`tel:${m.phone}`} className="flex items-center gap-2 text-link hover:text-link-hover">
                            <PhoneIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                            {m.phone}
                          </a>
                        </li>
                      ) : null}
                      {m.address ? (
                        <li className="flex items-start gap-2 text-ink">
                          <MapPinIcon className="mt-1 h-4 w-4 shrink-0 text-primary-strong" aria-hidden="true" />
                          {m.address}
                        </li>
                      ) : null}
                    </ul>
                  </Surface>
                </li>
              ))}
            </ul>
          ) : (
            <Surface tone="panel">
              <p className="text-muted">
                The directory is empty so far. As members are approved and choose to be listed, they
                will appear here.
              </p>
            </Surface>
          )}
        </Container>
      </Section>
    </>
  )
}

import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { Faq } from '@/components/blocks/Faq'
import { getInstalledApp, requireMember } from '@/lib/portal/data'
import { getOnboardingStatus } from '@/lib/portal/onboarding'
import { SetupChecklist } from '@/components/portal/HomeCards'

export const metadata: Metadata = buildMetadata({
  title: 'Getting Started in the Members Area',
  description:
    'How to add the Harrisonville Church of Christ members area to your phone, finish your profile, use chat and the calendar, and sign up for events and communion preparation.',
  path: '/members/getting-started',
  ogTitle: 'Members Area Guide',
  ogDescription: 'Install it on your phone, complete your profile, and find your way around.',
  noindex: true,
})

const faqs = [
  { question: 'Why can I not see the directory or chat yet?', answer: 'An admin approves each new account by hand. Until then the members area shows only your profile. If it has been more than a day or two, mention it to one of the elders.' },
  { question: 'Who can see my phone number and address?', answer: 'Only approved members, and only if you leave those boxes checked on your profile. Nothing in the members area is ever shown on the public website.' },
  { question: 'How do notifications work?', answer: 'The bell in the members bar collects announcements, messages, calendar additions, and event invitations. Pick which kinds reach you on the Notifications tab of your profile.' },
  { question: 'Can I change my sign-in email?', answer: 'Not yet on your own. Ask an admin and they will update it for you.' },
]

export default async function GettingStartedPage() {
  const ctx = await requireMember()
  const installed = await getInstalledApp(ctx)
  const status = getOnboardingStatus({ profile: ctx.profile, hasInstalledApp: Boolean(installed?.standalone_detected) })

  return (
    <>
      <PageHero eyebrow="Members" title="Getting started" lead="A five-minute tour of the members area, and how to make it feel like an app on your phone." />
      <Section tone="light">
        <Container className="max-w-3xl">
          <div className="flex flex-col gap-8">
            <SetupChecklist status={status} />

            <section id="install" aria-labelledby="install-heading" className="scroll-mt-32">
              <SectionHeading eyebrow="Step 1" title="Add the members area to your phone" id="install-heading" lead="It opens full screen from your home screen and remembers your sign-in." />
              <div className="grid gap-4 md:grid-cols-2">
                <Surface tone="card">
                  <h3 className="text-lg">iPhone or iPad (Safari)</h3>
                  <ol className="m-0 flex flex-col gap-2 pl-5 text-ink">
                    <li>Open this page in Safari.</li>
                    <li>Tap the Share button, the square with an arrow at the bottom of the screen.</li>
                    <li>Scroll down and tap Add to Home Screen.</li>
                    <li>Tap Add. The icon appears with your other apps.</li>
                  </ol>
                </Surface>
                <Surface tone="card">
                  <h3 className="text-lg">Android (Chrome)</h3>
                  <ol className="m-0 flex flex-col gap-2 pl-5 text-ink">
                    <li>Open this page in Chrome.</li>
                    <li>Tap the three-dot menu in the top corner.</li>
                    <li>Tap Add to Home screen, or Install app if you see it.</li>
                    <li>Tap Add. The icon appears with your other apps.</li>
                  </ol>
                </Surface>
              </div>
            </section>

            <section aria-labelledby="profile-heading">
              <SectionHeading eyebrow="Step 2" title="Complete your profile" id="profile-heading" lead="A photo, phone number, birthday, and gender help the church family know and reach you. You decide what the directory shows." />
              <Button href="/members/profile" variant="secondary" size="sm">
                Open my profile
              </Button>
            </section>

            <section aria-labelledby="tour-heading">
              <SectionHeading eyebrow="Step 3" title="Find your way around" id="tour-heading" />
              <dl className="m-0 grid gap-3 sm:grid-cols-2">
                {[
                  ['Home', 'Announcements, what is coming up, and who is serving at the next assemblies.'],
                  ['Directory', 'Families and members, with birthdays and anniversaries for the week.'],
                  ['Chat', 'The Congregation chat for everyone, Men and Ladies chats, any groups an admin sets up, and direct messages.'],
                  ['Calendar', 'Public church events, members-only events, special events, and the speaker for each assembly, by month, week, or day.'],
                  ['Events', 'Showers, meals, gospel meetings, and service projects with RSVPs and sign-up lists. Any member can create one.'],
                  ['Communion', 'Sign your household up to prepare communion for a month.'],
                ].map(([term, def]) => (
                  <div key={term} className="rounded-md border border-border/60 bg-bg p-4">
                    <dt className="font-semibold text-heading">{term}</dt>
                    <dd className="m-0 mt-1 text-sm text-muted">{def}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="faq-heading"><SectionHeading title="Common questions" id="faq-heading" /><Faq items={faqs} /></section>
          </div>
        </Container>
      </Section>
    </>
  )
}

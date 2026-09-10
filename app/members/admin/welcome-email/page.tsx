import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Notice } from '@/components/primitives/Feedback'
import { getAuthContext, isAdminRole } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/portal/data'
import { renderWelcomeEmail, welcomeEmailSubject } from '@/lib/portal/email'
import { WelcomeEmailTestForm } from '@/components/portal/WelcomeEmailTestForm'

export const metadata: Metadata = buildMetadata({
  title: 'Welcome Email Preview',
  description: 'Preview and test the welcome email new Harrisonville Church of Christ members receive when an admin approves their account.',
  path: '/members/admin/welcome-email',
  ogTitle: 'Welcome Email',
  ogDescription: 'What a newly approved member receives.',
  noindex: true,
})

export default async function WelcomeEmailPage() {
  const { profile } = await getAuthContext()
  if (!isAdminRole(profile)) redirect('/members/admin')
  const ctx = await requireAdmin()
  const configured = Boolean(process.env.RESEND_API_KEY && process.env.WELCOME_EMAIL_FROM)
  const { html } = renderWelcomeEmail({ full_name: 'New Member', email: 'member@example.com' })

  return (
    <>
      <PageHero eyebrow="Site admin" title="Welcome email" lead="Sent once, automatically, the moment you approve a member. This preview uses sample data." />
      <Section tone="light">
        <Container className="max-w-3xl">
          {configured ? null : (
            <Notice tone="warning" className="mb-5" title="Email delivery is not configured">
              <p>Add RESEND_API_KEY and WELCOME_EMAIL_FROM to the environment. Until then, approvals still work and no email goes out.</p>
            </Notice>
          )}
          <Surface tone="card" className="mb-6">
            <WelcomeEmailTestForm defaultEmail={ctx.profile.email} />
          </Surface>
          <SectionHeading eyebrow="Preview" title={welcomeEmailSubject()} />
          <div className="overflow-hidden rounded-lg border border-border-strong/40 shadow-sm">
            <iframe title="Welcome email preview" srcDoc={html} className="h-[56rem] w-full bg-surface" sandbox="" />
          </div>
        </Container>
      </Section>
    </>
  )
}

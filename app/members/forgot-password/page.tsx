import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { ForgotPasswordForm } from '@/components/portal/PasswordForms'

export const metadata: Metadata = buildMetadata({
  title: 'Reset Your Member Password',
  description: 'Request a password reset link for your Harrisonville Church of Christ member account.',
  path: '/members/forgot-password',
  ogTitle: 'Forgot Your Password',
  ogDescription: 'We will email a link to choose a new one.',
  noindex: true,
})

export default function ForgotPasswordPage() {
  return (
    <>
      <PageHero eyebrow="Members" title="Forgot your password?" lead="Enter the email on your member account and we will send a link to choose a new one." />
      <Section tone="light">
        <Container className="max-w-lg">
          <Surface tone="card">
            <ForgotPasswordForm />
          </Surface>
        </Container>
      </Section>
    </>
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { ResetPasswordForm } from '@/components/portal/PasswordForms'
import { getAuthContext } from '@/lib/supabase-server'

export const metadata: Metadata = buildMetadata({
  title: 'Choose a New Password',
  description: 'Set a new password for your Harrisonville Church of Christ member account.',
  path: '/members/reset-password',
  ogTitle: 'New Password',
  ogDescription: 'Finish resetting your member password.',
  noindex: true,
})

export default async function ResetPasswordPage() {
  const { user } = await getAuthContext()
  if (!user) redirect('/members/forgot-password')
  return (
    <>
      <PageHero eyebrow="Members" title="Choose a new password" lead="Pick something you will remember. It must be at least 8 characters." />
      <Section tone="light">
        <Container className="max-w-lg">
          <Surface tone="card">
            <ResetPasswordForm />
          </Surface>
        </Container>
      </Section>
    </>
  )
}

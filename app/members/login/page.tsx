import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { LoginForm } from '@/components/members/LoginForm'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getAuthContext } from '@/lib/supabase-server'

export const metadata: Metadata = buildMetadata({
  title: 'Member Sign In',
  description:
    'Sign in to the Harrisonville Church of Christ members area for congregation announcements and the member directory.',
  path: '/members/login',
  ogTitle: 'Members Area Sign In',
  ogDescription: 'Access congregation announcements and the member directory.',
  noindex: true,
})

export default async function MemberLoginPage() {
  const { user } = await getAuthContext()
  if (user) redirect('/members')

  return (
    <>
      <PageHero
        eyebrow="Members"
        title="Members area sign in"
        lead="Announcements, the member directory, and church administration live here. Sign in with your member account, or request access and an admin will approve it."
      />

      <Section tone="light">
        <Container className="max-w-lg">
          {isSupabaseConfigured ? (
            <Surface tone="card">
              <Suspense>
                <LoginForm />
              </Suspense>
            </Surface>
          ) : (
            <Surface tone="panel">
              <h2 className="mb-2 text-xl">The members area is almost ready</h2>
              <p className="text-muted">
                Member accounts have not been connected yet. If you expected to sign in here, please
                contact the church office and we will let you know the moment it opens.
              </p>
            </Surface>
          )}
        </Container>
      </Section>
    </>
  )
}

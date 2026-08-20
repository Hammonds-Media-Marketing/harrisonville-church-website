import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { CheckboxField, FieldShell, TextArea, TextField } from '@/components/primitives/Field'
import { getAuthContext } from '@/lib/supabase-server'
import { updateProfileAction } from '@/app/members/actions'

export const metadata: Metadata = buildMetadata({
  title: 'My Member Profile',
  description:
    'Manage your Harrisonville Church of Christ member profile: contact details and what you share in the member directory.',
  path: '/members/profile',
  ogTitle: 'Your Member Profile',
  ogDescription: 'Contact details and directory privacy choices.',
  noindex: true,
})

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const { user, profile } = await getAuthContext()
  if (!user) redirect('/members/login')

  const params = await searchParams

  return (
    <>
      <PageHero
        eyebrow="Members"
        title="My profile"
        lead="Your contact details, and exactly what the rest of the congregation can see in the directory. Nothing here is ever public on the website."
      />

      <Section tone="light">
        <Container className="max-w-2xl">
          {params.saved ? (
            <p role="status" className="mb-5 font-semibold text-primary-strong">
              Your profile has been saved.
            </p>
          ) : null}
          {params.error ? (
            <p role="alert" className="mb-5 font-semibold text-error">
              Something went wrong saving your profile. Please try again.
            </p>
          ) : null}

          <Surface tone="card">
            <form action={updateProfileAction} className="flex flex-col gap-5">
              <FieldShell id="profile-name" label="Full name" required>
                <TextField
                  id="profile-name"
                  name="full_name"
                  required
                  autoComplete="name"
                  defaultValue={profile?.full_name ?? ''}
                />
              </FieldShell>

              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-heading">Email</span>
                <p className="rounded-md border border-border bg-surface px-4 py-3 text-muted">
                  {profile?.email ?? user.email}
                </p>
                <p className="text-sm text-muted">Sign-in email. Contact an admin to change it.</p>
              </div>

              <FieldShell id="profile-phone" label="Phone">
                <TextField
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  defaultValue={profile?.phone ?? ''}
                />
              </FieldShell>

              <FieldShell id="profile-address" label="Address">
                <TextField
                  id="profile-address"
                  name="address"
                  autoComplete="street-address"
                  defaultValue={profile?.address ?? ''}
                />
              </FieldShell>

              <FieldShell
                id="profile-about"
                label="About"
                helper="A sentence the directory shows with your name: family, how long you have worshiped here, how you like to serve."
              >
                <TextArea id="profile-about" name="about" rows={3} defaultValue={profile?.about ?? ''} />
              </FieldShell>

              <fieldset className="flex flex-col gap-3 rounded-md border border-border p-4">
                <legend className="px-1 font-semibold text-heading">Directory privacy</legend>
                <CheckboxField
                  id="profile-show-directory"
                  name="show_in_directory"
                  label="List me in the member directory"
                  defaultChecked={profile?.show_in_directory ?? true}
                />
                <CheckboxField
                  id="profile-show-email"
                  name="show_email"
                  label="Show my email to members"
                  defaultChecked={profile?.show_email ?? true}
                />
                <CheckboxField
                  id="profile-show-phone"
                  name="show_phone"
                  label="Show my phone number to members"
                  defaultChecked={profile?.show_phone ?? true}
                />
                <CheckboxField
                  id="profile-show-address"
                  name="show_address"
                  label="Show my address to members"
                  defaultChecked={profile?.show_address ?? false}
                />
              </fieldset>

              <Button type="submit" variant="primary">
                Save profile
              </Button>
            </form>
          </Surface>
        </Container>
      </Section>
    </>
  )
}

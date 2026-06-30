import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section } from '@/components/primitives/Layout'
import { Button } from '@/components/primitives/Button'
import { Badge, SampleBadge } from '@/components/primitives/Badge'
import { Surface } from '@/components/primitives/Surface'
import { FieldShell, SelectField, TextArea, TextField } from '@/components/primitives/Field'
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs'
import { SampleNotice } from '@/components/blocks/SampleNotice'
import { Logo, Wordmark } from '@/components/brand/Logo'
import { SearchIcon } from '@/components/ui/icons'

export const dynamic = 'force-static'

export const metadata: Metadata = buildMetadata({
  title: 'Style Guide and Components',
  description:
    'The living style guide for the Harrisonville Church of Christ website: design tokens and every reusable interface primitive with its variants and states.',
  path: '/style-guide',
  ogTitle: 'Design Tokens and UI Primitives',
  ogDescription: 'The single source of truth for color, type, spacing, and the component library that builds the site.',
})

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Style Guide', path: '/style-guide' },
]

const colorRoles: { label: string; token: string; onDeep?: boolean }[] = [
  { label: 'Background', token: '--color-bg' },
  { label: 'Surface', token: '--color-surface' },
  { label: 'Surface 2', token: '--color-surface-2' },
  { label: 'Surface deep', token: '--color-surface-deep', onDeep: true },
  { label: 'Surface deep 2', token: '--color-surface-deep-2', onDeep: true },
  { label: 'Ink (body)', token: '--color-ink', onDeep: true },
  { label: 'Heading', token: '--color-heading', onDeep: true },
  { label: 'Muted', token: '--color-muted', onDeep: true },
  { label: 'Primary (teal)', token: '--color-primary', onDeep: true },
  { label: 'Primary strong', token: '--color-primary-strong', onDeep: true },
  { label: 'Secondary (gold)', token: '--color-secondary' },
  { label: 'Accent (green)', token: '--color-accent-strong', onDeep: true },
  { label: 'Link', token: '--color-link', onDeep: true },
  { label: 'Success', token: '--color-success', onDeep: true },
  { label: 'Error', token: '--color-error', onDeep: true },
  { label: 'Warning', token: '--color-warning', onDeep: true },
]

const typeScale = [
  { name: '5xl / Display', cls: 'text-5xl' },
  { name: '4xl / H1', cls: 'text-4xl' },
  { name: '3xl / H2', cls: 'text-3xl' },
  { name: '2xl / H3', cls: 'text-2xl' },
  { name: 'xl', cls: 'text-xl' },
  { name: 'lg / Lead', cls: 'text-lg' },
  { name: 'md / Body', cls: 'text-md' },
  { name: 'sm', cls: 'text-sm' },
]

const spacing = ['1', '2', '3', '4', '5', '6', '7', '8']

function GalleryBlock({ id, title, category, children }: { id: string; title: string; category: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-32 border-t border-border/50 py-7 first:border-0">
      <p className="font-body text-sm font-semibold uppercase tracking-[0.18em] text-primary-strong">{category}</p>
      <h2 id={`${id}-h`} className="mb-5 mt-1 text-2xl">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function StyleGuidePage() {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Style Guide', description: metadata.description as string, path: '/style-guide' }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />

      <Section tone="surface">
        <Container>
          <Breadcrumbs crumbs={breadcrumbs} />
          <h1 className="mt-5 text-4xl">Style guide and component gallery</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">
            Every color, type size, and component the site uses is defined once and shown here. Editing the tokens in{' '}
            <code>app/globals.css</code> restyles the entire build.
          </p>
        </Container>
      </Section>

      <Section tone="light">
        <Container>
          {/* Foundations: color */}
          <GalleryBlock id="color" category="Foundations" title="Color roles">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {colorRoles.map((c) => (
                <div key={c.token} className="overflow-hidden rounded-md border border-border/60">
                  <div className="h-16 w-full" style={{ background: `var(${c.token})` }} aria-hidden="true" />
                  <div className="bg-bg p-2">
                    <p className="text-sm font-semibold text-heading">{c.label}</p>
                    <p className="text-xs text-muted">{c.token}</p>
                  </div>
                </div>
              ))}
            </div>
          </GalleryBlock>

          {/* Foundations: typography */}
          <GalleryBlock id="type" category="Foundations" title="Typographic scale">
            <div className="flex flex-col gap-3">
              {typeScale.map((t) => (
                <div key={t.cls} className="flex items-baseline gap-4 border-b border-border/40 pb-2">
                  <span className="w-32 shrink-0 text-sm text-muted">{t.name}</span>
                  <span className={`${t.cls} font-display text-heading`}>Outlook Drive</span>
                </div>
              ))}
              <p className="mt-2 text-sm text-muted">
                Display font: Montserrat. Body font: Mulish.
              </p>
            </div>
          </GalleryBlock>

          {/* Foundations: spacing + radius + shadow */}
          <GalleryBlock id="spacing" category="Foundations" title="Spacing, radius, elevation">
            <div className="flex flex-wrap items-end gap-3">
              {spacing.map((s) => (
                <div key={s} className="text-center">
                  <div className="bg-primary-strong" style={{ width: `var(--space-${s})`, height: `var(--space-${s})` }} aria-hidden="true" />
                  <span className="text-xs text-muted">{s}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-4">
              <div className="grid h-20 w-32 place-items-center rounded-sm bg-surface text-sm text-muted shadow-sm">radius-sm / shadow-sm</div>
              <div className="grid h-20 w-32 place-items-center rounded-md bg-surface text-sm text-muted shadow-md">radius-md / shadow-md</div>
              <div className="grid h-20 w-32 place-items-center rounded-lg bg-surface text-sm text-muted shadow-lg">radius-lg / shadow-lg</div>
            </div>
          </GalleryBlock>

          {/* Brand */}
          <GalleryBlock id="brand" category="Brand" title="Logo and wordmark">
            <div className="flex flex-wrap items-center gap-8">
              <Logo className="h-16 w-auto" priority={false} />
              <Wordmark />
              <div className="rounded-md bg-surface-deep p-4">
                <Wordmark onDeep />
              </div>
            </div>
          </GalleryBlock>

          {/* Buttons */}
          <GalleryBlock id="buttons" category="Buttons" title="Buttons — variants, sizes, states">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="accent">Accent</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link button</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled>Disabled</Button>
                <Button loading>Loading</Button>
                <Button variant="secondary" disabled>Disabled</Button>
              </div>
            </div>
          </GalleryBlock>

          {/* Badges */}
          <GalleryBlock id="badges" category="Badges" title="Badges and tags">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="neutral">Neutral</Badge>
              <Badge tone="primary">Primary</Badge>
              <Badge tone="accent">Accent</Badge>
              <Badge tone="gold">Gold</Badge>
              <SampleBadge />
            </div>
          </GalleryBlock>

          {/* Inputs */}
          <GalleryBlock id="inputs" category="Inputs" title="Text inputs — default, helper, error">
            <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
              <FieldShell id="sg-name" label="Full name" required>
                <TextField id="sg-name" name="sg-name" required autoComplete="name" placeholder="Jane Doe" />
              </FieldShell>
              <FieldShell id="sg-email" label="Email" helper="We reply personally, never with spam.">
                <TextField id="sg-email" name="sg-email" type="email" placeholder="you@example.com" />
              </FieldShell>
              <FieldShell id="sg-err" label="Phone" error="Please enter a valid phone number.">
                <TextField id="sg-err" name="sg-err" type="tel" />
              </FieldShell>
              <FieldShell id="sg-msg" label="Message">
                <TextArea id="sg-msg" name="sg-msg" rows={3} placeholder="How can we help?" />
              </FieldShell>
            </div>
          </GalleryBlock>

          {/* Selections */}
          <GalleryBlock id="selections" category="Selections" title="Select control">
            <div className="max-w-sm">
              <FieldShell id="sg-select" label="What is this about?" required>
                <SelectField id="sg-select" name="sg-select" required options={['Planning a visit', 'A Bible question', 'Something else']} />
              </FieldShell>
            </div>
          </GalleryBlock>

          {/* Surfaces */}
          <GalleryBlock id="surfaces" category="Surfaces" title="Cards and panels">
            <div className="grid gap-4 md:grid-cols-3">
              <Surface tone="card">
                <h3 className="text-lg">Card</h3>
                <p className="mt-1 text-ink">The default container on light backgrounds.</p>
              </Surface>
              <Surface tone="panel">
                <h3 className="text-lg">Panel</h3>
                <p className="mt-1 text-ink">A softer surface tint for grouped content.</p>
              </Surface>
              <Surface tone="deep">
                <h3 className="text-lg text-on-deep">Deep</h3>
                <p className="mt-1 text-on-deep-muted">A raised panel used on navy sections.</p>
              </Surface>
            </div>
          </GalleryBlock>

          {/* Lists */}
          <GalleryBlock id="lists" category="Lists" title="List and definition layouts">
            <div className="grid gap-6 md:grid-cols-2">
              <ul className="flex flex-col gap-2">
                {['Singing without instruments', 'Weekly Lord’s Supper', 'A sermon from Scripture'].map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span aria-hidden="true" className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-secondary-active" />
                    <span className="text-ink">{i}</span>
                  </li>
                ))}
              </ul>
              <dl className="flex flex-col gap-2">
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <dt className="text-muted">Sunday morning</dt>
                  <dd className="font-semibold text-heading">10:00 AM</dd>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <dt className="text-muted">Sunday afternoon</dt>
                  <dd className="font-semibold text-heading">2:00 PM</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Wednesday</dt>
                  <dd className="font-semibold text-heading">7:30 PM</dd>
                </div>
              </dl>
            </div>
          </GalleryBlock>

          {/* Navigations */}
          <GalleryBlock id="navigations" category="Navigations" title="Breadcrumbs">
            <Breadcrumbs crumbs={[{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }, { name: 'What to Expect', path: '/about/what-to-expect' }]} />
            <p className="mt-3 text-sm text-muted">
              The primary header navigation and footer navigation are shown live on every page.
            </p>
          </GalleryBlock>

          {/* Feedback */}
          <GalleryBlock id="feedback" category="Feedback" title="Alerts and notices">
            <div className="flex flex-col gap-3">
              <div role="status" className="rounded-md border border-success/40 bg-success-surface px-4 py-3 text-ink">
                Success: your message has been received.
              </div>
              <div role="alert" className="rounded-md border border-error/40 bg-error-surface px-4 py-3 text-error">
                Error: something went wrong. Please try again.
              </div>
              <SampleNotice label="This is the placeholder-content banner." />
            </div>
          </GalleryBlock>

          {/* Discovery */}
          <GalleryBlock id="discovery" category="Discovery" title="Search field and filter chips">
            <div className="flex max-w-md items-center gap-2 rounded-full border border-border bg-input-bg px-4 py-2">
              <SearchIcon className="h-5 w-5 text-muted" />
              <input
                type="search"
                aria-label="Search the site"
                placeholder="Search…"
                className="w-full bg-transparent text-ink placeholder:text-placeholder focus:outline-none"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-primary-strong bg-primary-strong px-4 py-1.5 text-sm font-semibold text-on-primary">All</span>
              <span className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-ink">Salvation</span>
              <span className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-ink">Worship</span>
            </div>
          </GalleryBlock>
        </Container>
      </Section>
    </>
  )
}

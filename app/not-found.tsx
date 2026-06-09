import type { Metadata } from 'next'
import { Button } from '@/components/primitives/Button'
import { Container, Section } from '@/components/primitives/Layout'
import { primaryNav } from '@/lib/site'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <Section tone="light" className="min-h-[60vh]">
      <Container className="flex max-w-prose flex-col items-center gap-5 text-center">
        <p className="font-display text-5xl text-primary-strong">404</p>
        <h1 className="text-3xl">This page drifted out to sea</h1>
        <p className="text-lg text-muted">
          The page you were looking for is not here. Let the light guide you back to shore.
        </p>
        <Button href="/" size="lg">
          Return home
        </Button>
        <nav aria-label="Helpful links" className="mt-4">
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-link">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-link-hover">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </Section>
  )
}

import type { ReactNode } from 'react'
import Image from 'next/image'
import { Eyebrow } from '@/components/primitives/Layout'
import { Wave } from '@/components/decor/Wave'

/**
 * PageHero — the interior-page header band. Carries the homepage hero's sky
 * gradient and wave motif onto every inner page so the site opens with the
 * same "coastal beacon" atmosphere throughout, and gives the congregation's
 * photography a home above the fold.
 *
 * Three visual modes, chosen by props:
 *  - `photo`      → framed photograph beside the heading (eager/priority load,
 *                   per the hero-image rule)
 *  - `portraits`  → an overlapping cluster of people photos (leadership)
 *  - neither      → the brand emblem as a soft decorative seal
 *
 * `waveFill` must match the background of the section the wave flows into
 * (defaults to the page background token).
 */

type Photo = { src: string; alt: string }

export function PageHero({
  eyebrow,
  title,
  lead,
  id = 'page-hero-heading',
  photo,
  portraits,
  waveFill = 'var(--color-bg)',
  children,
}: {
  eyebrow: string
  title: ReactNode
  lead?: ReactNode
  id?: string
  photo?: Photo
  portraits?: Photo[]
  waveFill?: string
  children?: ReactNode
}) {
  const hasVisual = Boolean(photo || (portraits && portraits.length))

  return (
    <section
      aria-labelledby={id}
      className="relative overflow-hidden text-ink"
      style={{ background: 'var(--gradient-hero-sky)' }}
    >
      <div
        className={`mx-auto grid max-w-container items-center gap-8 px-5 pb-9 pt-8 md:pb-10 md:pt-9 ${
          hasVisual ? 'lg:grid-cols-[1.15fr_0.85fr]' : ''
        }`}
      >
        <div className="relative flex max-w-2xl flex-col gap-4">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 id={id} className="text-4xl md:text-5xl">
            {title}
          </h1>
          {lead ? <p className="text-lg text-muted">{lead}</p> : null}
          {children}
        </div>

        {photo ? (
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            {/* Offset backing panel gives the photograph a mounted, kept feel. */}
            <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 rounded-xl bg-primary-strong/20" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl shadow-md">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="photo-grade object-cover"
              />
            </div>
          </div>
        ) : null}

        {portraits && portraits.length ? (
          <div className="flex items-center justify-center lg:justify-end">
            <ul className="flex items-center -space-x-6">
              {portraits.map((p, i) => (
                <li key={p.src} className={i % 2 ? 'translate-y-4' : ''}>
                  <Image
                    src={p.src}
                    alt={p.alt}
                    width={176}
                    height={176}
                    priority
                    sizes="(max-width: 640px) 7rem, 11rem"
                    className="photo-grade h-28 w-28 rounded-full border-4 border-bg object-cover object-top shadow-md md:h-44 md:w-44"
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!hasVisual ? (
          /* Brand emblem as a soft seal behind the heading, desktop only. */
          <Image
            src="/assets/logos/logo-emblem.svg"
            alt=""
            aria-hidden="true"
            width={340}
            height={340}
            priority
            className="pointer-events-none absolute -right-6 top-1/2 hidden h-auto w-72 -translate-y-1/2 opacity-15 lg:block xl:right-10"
          />
        ) : null}
      </div>
      <Wave fill={waveFill} />
    </section>
  )
}

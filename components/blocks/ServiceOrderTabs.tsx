'use client'

import { useId, useRef, useState } from 'react'
import { Surface } from '@/components/primitives/Surface'

export type WorshipAct = { title: string; body: string }
export type ServicePhase = { label: string; items: string[] }
export type ServiceOrder = {
  id: string
  tabLabel: string
  time: string
  note?: string
  phases: ServicePhase[]
  /** Titles from the worship-acts list that this service includes. */
  actTitles: string[]
}

/* Phase accents cycle through the palette so each block of the service reads
   as its own chapter, echoing the grouped-timeline treatment on the Valley
   Parkway build. Colors are decorative; text stays on heading/ink tokens. */
const phaseAccents = [
  { pill: 'border-secondary-active', dot: 'bg-secondary-active' },
  { pill: 'border-accent-strong', dot: 'bg-accent-strong' },
  { pill: 'border-primary-strong', dot: 'bg-primary-strong' },
]

/**
 * ServiceOrderTabs — pick a service time to see the order it follows beside
 * an explanation of each part of worship it includes. All three panels are
 * server-rendered into the page; the tabs only toggle the `hidden` attribute,
 * so crawlers that do not run JavaScript still read every order of service.
 */
export function ServiceOrderTabs({
  orders,
  acts,
  actsIntro,
}: {
  orders: ServiceOrder[]
  acts: WorshipAct[]
  actsIntro: string
}) {
  const [active, setActive] = useState(0)
  const baseId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const count = orders.length
    let next: number | null = null
    if (event.key === 'ArrowRight') next = (active + 1) % count
    else if (event.key === 'ArrowLeft') next = (active - 1 + count) % count
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = count - 1
    if (next !== null) {
      event.preventDefault()
      setActive(next)
      tabRefs.current[next]?.focus()
    }
  }

  return (
    <div>
      <div role="tablist" aria-label="Service times" className="flex flex-wrap gap-3">
        {orders.map((order, i) => (
          <button
            key={order.id}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${order.id}`}
            aria-selected={active === i}
            aria-controls={`${baseId}-panel-${order.id}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={onKeyDown}
            className={`rounded-md px-5 py-3 font-semibold transition-colors duration-base ease-out ${
              active === i
                ? 'bg-primary-strong text-on-primary'
                : 'border border-border-strong bg-bg text-heading hover:bg-surface'
            }`}
          >
            {order.tabLabel}
          </button>
        ))}
      </div>

      {orders.map((order, i) => {
        const orderActs = acts.filter((act) => order.actTitles.includes(act.title))
        return (
          <div
            key={order.id}
            role="tabpanel"
            id={`${baseId}-panel-${order.id}`}
            aria-labelledby={`${baseId}-tab-${order.id}`}
            hidden={active !== i}
            className="mt-7"
          >
            <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              {/* Order of service as a grouped timeline */}
              <Surface tone="card">
                <h3 className="sr-only">{order.tabLabel} order of service</h3>
                {order.note ? <p className="mb-4 text-muted">{order.note}</p> : null}
                <div className="relative">
                  <span aria-hidden="true" className="absolute bottom-1 left-1 top-3 w-px bg-border-strong" />
                  <p className="m-0 flex items-center gap-3">
                    <span aria-hidden="true" className="relative h-2.5 w-2.5 shrink-0 bg-heading" />
                    <span className="font-display text-2xl text-heading">{order.time}</span>
                  </p>
                  <ol className="flex flex-col">
                    {order.phases.map((phase, p) => {
                      const accent = phaseAccents[p % phaseAccents.length]
                      return (
                        <li key={phase.label} className="pt-5">
                          <p
                            className={`relative m-0 inline-block rounded-full border-2 bg-bg px-4 py-1 text-sm font-semibold text-heading ${accent.pill}`}
                          >
                            {phase.label}
                          </p>
                          <ol className="flex flex-col">
                            {phase.items.map((item) => (
                              <li key={item} className="flex items-center gap-0 pt-4">
                                <span aria-hidden="true" className={`relative h-2 w-2 shrink-0 rounded-full ${accent.dot}`} />
                                <span aria-hidden="true" className="mx-2 w-8 shrink-0 border-t border-dotted border-border-strong" />
                                <span className="text-sm text-ink">{item}</span>
                              </li>
                            ))}
                          </ol>
                        </li>
                      )
                    })}
                  </ol>
                  <p aria-hidden="true" className="m-0 pt-5">
                    <span className="relative block h-2.5 w-2.5 bg-heading" />
                  </p>
                </div>
              </Surface>

              {/* What each part of this service means */}
              <Surface tone="card" className="flex flex-col gap-4">
                <h3 className="text-xl">Each part of worship, explained</h3>
                <p className="m-0 text-ink">{actsIntro}</p>
                <div className="flex flex-col">
                  {orderActs.map((act) => (
                    <div key={act.title} className="border-t border-border/50 py-4 last:pb-0">
                      <h4 className="font-display text-lg text-heading">{act.title}</h4>
                      <p className="m-0 mt-1 text-ink">{act.body}</p>
                    </div>
                  ))}
                </div>
              </Surface>
            </div>
          </div>
        )
      })}
    </div>
  )
}

'use client'

import { useId, useRef, useState } from 'react'
import { Surface } from '@/components/primitives/Surface'
import { ClockIcon } from '@/components/ui/icons'

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

/**
 * ServiceOrderTabs — pick a service time to see the order it follows beside
 * an explanation of each part of worship it includes. All panels are
 * server-rendered into the page; the tabs only toggle the `hidden` attribute,
 * so crawlers that do not run JavaScript still read every order of service.
 *
 * The order itself renders in the site's own visual language: gold-dashed
 * small-caps phase labels, with the steps of each phase as numbered navy
 * markers on a connected line, numbered continuously through the service.
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
        let step = 0
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
              {/* Order of service */}
              <Surface tone="card">
                <h3 className="sr-only">{order.tabLabel} order of service</h3>
                <p className="m-0 flex items-center gap-3">
                  <ClockIcon className="h-6 w-6 shrink-0 text-primary-strong" />
                  <span className="font-display text-2xl text-heading">{order.time}</span>
                </p>
                {order.note ? <p className="m-0 mt-3 text-muted">{order.note}</p> : null}
                <ol className="mt-2 flex flex-col">
                  {order.phases.map((phase) => {
                    const start = step
                    step += phase.items.length
                    return (
                      <li key={phase.label}>
                        <p className="m-0 flex items-center gap-2 pb-3 pt-5 text-sm font-semibold uppercase tracking-[0.18em] text-primary-strong">
                          <span aria-hidden="true" className="inline-block h-0.5 w-5 rounded-full bg-secondary-active" />
                          {phase.label}
                        </p>
                        <ol className="flex flex-col">
                          {phase.items.map((item, j) => (
                            <li key={item} className="relative flex gap-3 pb-4 last:pb-0">
                              {j < phase.items.length - 1 ? (
                                <span aria-hidden="true" className="absolute bottom-0 left-3.5 top-7 w-px bg-border-strong" />
                              ) : null}
                              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-strong text-sm font-semibold text-on-primary">
                                {start + j + 1}
                              </span>
                              <span className="pt-0.5 text-ink">{item}</span>
                            </li>
                          ))}
                        </ol>
                      </li>
                    )
                  })}
                </ol>
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

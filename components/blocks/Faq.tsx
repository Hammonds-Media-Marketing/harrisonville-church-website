import type { Faq as FaqItem } from '@/content/faqs'
import { ChevronDownIcon } from '@/components/ui/icons'

/**
 * FAQ accordion built on native <details>/<summary>: fully keyboard operable,
 * present in the served DOM with no JavaScript, and readable by retrieval
 * agents. Pair with faqSchema() on the page for rich-result eligibility.
 */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-border/60 rounded-lg border border-border/60 bg-bg">
      {items.map((item) => (
        <details key={item.question} className="group px-5">
          <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 font-display text-xl text-heading marker:content-['']">
            {item.question}
            <ChevronDownIcon className="h-5 w-5 shrink-0 text-primary-strong transition-transform group-open:rotate-180" />
          </summary>
          <p className="pb-5 text-ink">{item.answer}</p>
        </details>
      ))}
    </div>
  )
}

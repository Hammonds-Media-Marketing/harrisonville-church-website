import type { Faq as FaqItem } from '@/content/faqs'
import { ChevronDownIcon } from '@/components/ui/icons'

/** A question and answer, optionally tagged with the copy keys it renders. */
export type FaqEntry = FaqItem & { copyKeys?: { question: string; answer: string } }

/**
 * FAQ accordion built on native <details>/<summary>: fully keyboard operable,
 * present in the served DOM with no JavaScript, and readable by retrieval
 * agents. Pair with faqSchema() on the page for rich-result eligibility.
 */
export function Faq({ items }: { items: FaqEntry[] }) {
  return (
    <div className="divide-y divide-border/60 rounded-lg border border-border/60 bg-bg">
      {items.map((item) => (
        <details key={item.question} className="group px-5">
          <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 font-display text-xl text-heading marker:content-['']">
            <span data-copy={item.copyKeys?.question} data-copy-kind={item.copyKeys ? 'text' : undefined}>
              {item.question}
            </span>
            <ChevronDownIcon className="h-5 w-5 shrink-0 text-primary-strong transition-transform group-open:rotate-180" />
          </summary>
          <p className="pb-5 text-ink">
            <span data-copy={item.copyKeys?.answer} data-copy-kind={item.copyKeys ? 'longText' : undefined}>
              {item.answer}
            </span>
          </p>
        </details>
      ))}
    </div>
  )
}

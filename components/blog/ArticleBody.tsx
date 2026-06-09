import type { BlogPost } from '@/content/types'
import { slugify } from '@/lib/format'

/** Renders the structured article body. h2/h3 blocks receive slug ids so the
 *  table of contents and in-page anchors line up. Server-rendered: all article
 *  text is in the served HTML for readers and retrieval agents. */
export function ArticleBody({ body }: { body: BlogPost['body'] }) {
  return (
    <div className="flex flex-col gap-5">
      {body.map((block, i) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2 key={i} id={slugify(block.text || '')} className="scroll-mt-32 text-2xl">
                {block.text}
              </h2>
            )
          case 'h3':
            return (
              <h3 key={i} id={slugify(block.text || '')} className="scroll-mt-32 text-xl">
                {block.text}
              </h3>
            )
          case 'scripture':
            return (
              <blockquote
                key={i}
                className="rounded-r-md border-l-4 border-primary bg-surface px-5 py-4 text-ink"
              >
                <p className="italic">{block.text}</p>
                {block.ref ? (
                  <cite className="mt-2 block font-body text-sm font-semibold not-italic text-primary-strong">
                    {block.ref}
                  </cite>
                ) : null}
              </blockquote>
            )
          case 'list':
            return (
              <ul key={i} className="flex flex-col gap-2 pl-1">
                {(block.items || []).map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span aria-hidden="true" className="mt-2.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-secondary-active" />
                    <span className="text-ink">{item}</span>
                  </li>
                ))}
              </ul>
            )
          default:
            return (
              <p key={i} className="text-ink">
                {block.text}
              </p>
            )
        }
      })}
    </div>
  )
}

/** Build table-of-contents entries from the h2 headings in a post body. */
export function tocFromBody(body: BlogPost['body']): { id: string; text: string }[] {
  return body
    .filter((b) => b.type === 'h2' && b.text)
    .map((b) => ({ id: slugify(b.text as string), text: b.text as string }))
}

import { redirect } from 'next/navigation'

/**
 * The visual editor's old index. Every page, designed or custom, is now
 * listed on /members/admin/pages, which opens the right editor for each, so
 * old bookmarks land there. Individual pages are still edited at
 * /members/admin/editor/<path>.
 */
export default function EditorIndexPage() {
  redirect('/members/admin/pages')
}

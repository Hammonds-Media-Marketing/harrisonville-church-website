/** Skip link — first focusable element on the page; jumps keyboard and screen
 *  reader users straight to the main content. */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-toast focus:rounded-md focus:bg-primary-strong focus:px-4 focus:py-2 focus:text-on-primary"
    >
      Skip to main content
    </a>
  )
}

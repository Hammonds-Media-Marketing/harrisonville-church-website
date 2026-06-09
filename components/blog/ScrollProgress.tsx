'use client'

import { useEffect, useState } from 'react'

/** Reading-progress bar fixed to the top of the viewport. Decorative; hidden
 *  from assistive tech (the article itself conveys progress). */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = document.documentElement
      const scrollable = el.scrollHeight - el.clientHeight
      setProgress(scrollable > 0 ? Math.min(100, (el.scrollTop / scrollable) * 100) : 0)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-toast h-1 bg-transparent">
      <div
        className="h-full bg-secondary transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Interactive lighthouse built from the brand emblem's own vector artwork
 * (public/assets/logos/logo-emblem.svg): the light-gray tapered tower with
 * navy line work, gold-lit lantern, scribbled grass knoll, and layered blue
 * water swooshes. The emblem's four golden starburst rays are lifted into a
 * rotating group so the lighthouse light itself follows the visitor: on
 * devices with a fine pointer (desktop) it tracks the cursor anywhere on
 * screen; on coarse pointers (phones, tablets) it swings with scroll position
 * instead. This is the only interactive part of the hero; the heading, copy,
 * and buttons are server-rendered in the page for SEO.
 *
 * Accessibility / resilience:
 *  - Decorative (aria-hidden) — it conveys no information a reader needs.
 *  - prefers-reduced-motion: the rays hold the emblem's resting angle.
 */

// The emblem's rays converge just left of the lantern glass — the group
// rotates around this point.
const PIVOT_X = 531
const PIVOT_Y = 232

// Rotation limits, relative to the emblem's resting direction (rays pointing
// left). Negative swings the light down toward the water; positive lifts it
// into the sky. Kept inside the canvas so the rays never clip or point into
// the ground.
const MIN_ROT = -55
const MAX_ROT = 22

export function LighthouseScene() {
  const pivotRef = useRef<SVGCircleElement>(null)
  const frame = useRef<number | null>(null)
  const [rotation, setRotation] = useState(0)
  const [mode, setMode] = useState<'track' | 'scroll' | 'static'>('static')

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setMode('static')
      return
    }

    const fine = window.matchMedia('(pointer: fine)').matches

    if (fine) {
      setMode('track')
      const onMove = (e: PointerEvent) => {
        if (frame.current) return
        frame.current = requestAnimationFrame(() => {
          frame.current = null
          const pivot = pivotRef.current
          if (!pivot) return
          const r = pivot.getBoundingClientRect()
          const cx = r.left + r.width / 2
          const cy = r.top + r.height / 2
          const deg = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI
          // The rays rest pointing left (180°) — convert the pointer angle to
          // a rotation relative to that, normalized to (-180, 180].
          const rel = ((deg - 180 + 540) % 360) - 180
          setRotation(Math.max(MIN_ROT, Math.min(MAX_ROT, rel)))
        })
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      return () => {
        window.removeEventListener('pointermove', onMove)
        if (frame.current) cancelAnimationFrame(frame.current)
      }
    }

    setMode('scroll')
    const onScroll = () => {
      if (frame.current) return
      frame.current = requestAnimationFrame(() => {
        frame.current = null
        // Sweep the full arc across roughly the first screen-and-a-bit of
        // scrolling, while the lighthouse is still in view.
        const range = Math.max(window.innerHeight * 1.2, 1)
        const p = Math.min(window.scrollY / range, 1)
        setRotation(18 - p * 68)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [])

  return (
    <svg
      viewBox="0 0 933.01 945.16"
      className="h-full w-full"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="beamGrad" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#facb27" stopOpacity="0.4" />
          <stop offset="55%" stopColor="#fde874" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#fde874" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde874" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fde874" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Daytime sky — soft drifting clouds behind the light */}
      <g fill="#ffffff">
        <g opacity="0.9">
          <ellipse cx="168" cy="118" rx="52" ry="21" />
          <ellipse cx="214" cy="106" rx="37" ry="20" />
          <ellipse cx="131" cy="109" rx="31" ry="17" />
        </g>
        <g opacity="0.75">
          <ellipse cx="806" cy="84" rx="46" ry="18" />
          <ellipse cx="843" cy="73" rx="31" ry="17" />
          <ellipse cx="772" cy="76" rx="25" ry="14" />
        </g>
      </g>

      {/* Rotating light — the emblem's own starburst rays plus a soft beam
          cone, pivoting where the rays converge at the lantern. */}
      <g
        style={{
          transformOrigin: `${PIVOT_X}px ${PIVOT_Y}px`,
          transform: `rotate(${rotation}deg)`,
          transition: mode !== 'static' ? 'transform 240ms cubic-bezier(0.16,1,0.3,1)' : undefined,
        }}
      >
        <polygon
          points={`${PIVOT_X - 6},${PIVOT_Y - 10} -40,${PIVOT_Y - 152} -56,${PIVOT_Y} -40,${PIVOT_Y + 152} ${PIVOT_X - 6},${PIVOT_Y + 10}`}
          fill="url(#beamGrad)"
        />
        <g>
          <path fill="#f9ce34" d="M528.13,243.53c.69.18,2.05-.57,3.36,1.69l-63.3,27.28-121.23,49.64c-2.68,1.1-5,2.83-6.29-.85,62.04-28.52,124.3-55.52,187.46-77.76Z"/>
          <path fill="#facc29" d="M534.17,259.18l-156.34,110.17c-.84-.49-1.92-.03-3.28-1.59,45.56-34.99,91.9-67.24,139.23-98.59l18.17-12.04c1.2-.79,2.59.09,2.22,2.05Z"/>
          <g>
            <path fill="#fcc920" d="M519.62,214.05c3.56-.65,5.13-1.79,6.1-.43.58.81.79,2.29.47,3.15-.35.93-1.27.98-3.08,1.11-1.43.11-2.86.31-4.3.36-7.04.29-14.04,1.57-21.07,2.07-4.27.3-8.55.6-12.82.9-3.02.21-6.05.35-9.07.64-129.74,12.06-258.72,19.94-388.62,25.37l-49.45,2.07c-12.73,1.22-25.72,3.08-37.78-.98l7.27-.08c7.52-.68,15.06-1.4,22.6-2.16h8.48c7.52-.67,15.06-1.3,22.63-1.88l343.04-23.63,83.6-4.76c18.17-.67,25.53-1.1,28.22-1.38,1.26-.13,2.53-.14,3.78-.37Z"/>
            <path fill="#facb27" d="M532.82,229.35l-48.53,12.2-325.85,75.62-7.07,2.07h-4.27s-5.6,2.15-5.6,2.15l-2.42.27c-2.37.27-5.32.81-7.56-1.73l139.94-35.1,211.71-47.31,48.2-10.72c1.07-.24,1.8,1.33,1.44,2.57Z"/>
          </g>
        </g>
      </g>

      {/* Lantern glow — the rotation pivot sits at its center */}
      <circle ref={pivotRef} cx={PIVOT_X} cy={PIVOT_Y} r="80" fill="url(#lampGlow)" />

      {/* Lighthouse, grass, and water — the emblem artwork, verbatim */}
      <g>
        <path fill="#dcdfe5" d="M603.09,427.65l.06,13.94c-3.68,3.05-2.3,4.02,4.14,2.91l1.77,2.66c-.88,1.98-3.91,2.71-8.05,3.58-8.68,116.93-17.37,233.85-26.05,350.78-8.06,1.7-16.12,3.39-24.17,5.09-15.06-6.36-30.11-12.72-45.17-19.09,17.8-115.36,35.59-230.72,53.39-346.09l44.07-13.79Z"/>
        <path fill="#dbdfe5" d="M766.96,434.54c-19.86-3.51-40.05-14.49-62.7-14.69l-47.78-.43c.91-1.23,2.38-2.04,4.58-2.1l41.26-1.17c-46.35-7.16-94.28-3.27-139.94,12.04-1.02-3.78-.05-6.58.69-11,51.25-20.33,104.67-23.27,161.35-19.73-52.42-14.47-108.3-10.86-158.98,5.59-1.04-4.38-.02-10.45,2.48-12.1,59.28-20.81,130.34-19.65,191.72-5.78l7.35,49.37Z"/>
        <polygon fill="#fee25b" points="661.13 247.22 613.44 252.05 613.81 172.55 661.42 169.51 661.13 247.22"/>
        <polygon fill="#fde874" points="720.85 251.21 673.45 247.66 674.26 169.47 720.89 174.27 720.85 251.21"/>
        <path fill="#d8dde4" d="M618.59,272.97l-7.49,4.5-.37,36.93,11.67-.27c-.19,1.55-1.75,2.77-4.02,2.12l-37.78,5.15c-2.33-13.76.24-26.75-5.16-41.37-5.1,15.27-4.01,28.64-5.94,43.02-5.05,2.26-10.21,3.5-15.87,4-1.77-13.49-.24-25.96-5.04-38.1l-5.74,41.89-21.84,8.96-1.53-41.02c32.43-16.24,65.66-21.94,99.1-25.81Z"/>
        <polygon fill="#fae363" points="600.46 253.36 575.34 258.47 575.61 181.09 600.1 175.24 600.46 253.36"/>
        <polygon fill="#fde86c" points="758.1 256.06 733.82 253.03 734.31 176.33 758.56 180.78 758.1 256.06"/>
        <path fill="#dcdfe6" d="M612.44,328.88l-1.28,18.29-63.17,12.83c-12.99,2.64-24.18,8.02-34.4,13.87-1.02-5.98-1.22-12.64,1.01-15.17,1.77-2.02,5.38-4.13,9-5.92,27.93-13.79,57.66-20.07,88.83-23.9Z"/>
        <path fill="#e1e4e8" d="M652.11,129.64c.02-.06.06-.1.08-.15-.02,0-.03,0-.05,0l13.39-48.1c-16.65,20.93-37.26,36.43-59.49,54.35,16.33-2.14,31.1-3.92,45.73-4.7.09-.47.22-.94.34-1.41Z"/>
        <path fill="#d6dbe1" d="M647.96,139.17l-1.83,14.03c-26.01,1.49-50.96,6.5-77.77,12.87,19.81-16.5,53.87-23.94,79.6-26.9Z"/>
      </g>
      <g>
        <g>
          <path fill="#092a4e" stroke="#000" strokeMiterlimit="10" strokeWidth="0.25" d="M697.94,441.16c-30.62.79-59.04,2.83-88.92,6.83l-29.88,3.98c8.07-5.52,16.28-7.93,23.97-9.55,31.09-6.55,63.42-6.86,94.82-1.26Z"/>
          <path fill="#092a4e" stroke="#000" strokeMiterlimit="10" strokeWidth="0.25" d="M706.82,569.79l-31.28.71.88-46.97c.24-13.4,6.31-27.14,15.93-27.09,9.24.02,13.55,14.24,13.78,29.24l.69,44.11Z"/>
          <path fill="#092a4e" d="M853.76,876.76c-.1-.55-.19-1.07-.31-1.6l-65.11-460.58c23.38-5.62,44.78-17.4,44.04-40.12l-2.36-74.49c-.33-10.81-2.38-19.14-12.74-23.21l-40.47-15.97-.69-71.33c8.19.57,14.36-1.69,17.95-5.48,4.31-4.57,5.45-13.02.6-17.71l-41.62-40.14-71.64-59.28-6.43-60.47c-.38-3.71-3.95-6-6.33-6.33-3.07-.4-6.76,1.43-7.29,5.38l-8.38,64.52-80.49,61.57c-19.05,14.55-47.33,39.21-36.52,54.78,4.67,6.74,13.62,6.98,21.47,7.86l-1.67,67.87c-28.19,9.28-53.42,12.59-53.97,42.09l-1.31,72.61c-.21,12.02,4.81,22.55,15.57,27.5l22.52,10.4c-15.78,111.56-31.62,223.1-47.4,334.66-1.55,10.86-3.07,21.74-4.62,32.59,9.36-.29,18.74-.57,28.12-.86,1.52-11.62,3.02-23.21,4.55-34.83,13.24-101.3,26.5-202.65,39.73-303.95l43.5-13.59c.17-.07.38-.14.57-.19,17.02-5.31,35.4-8.38,53.4-8.21,14.78-1.26,29.66-1.74,44.69-1.43.31-.74.6-1.4.93-1.86h.21c-.07,0-.12-.02-.19-.02-46.31-7.14-94.18-3.21-139.75,12.07-1.02-3.79-.05-6.59.69-11,51.23-20.33,104.66-23.28,161.34-19.74-52.42-14.47-108.3-10.86-158.98,5.59-1.05-4.38-.02-10.45,2.48-12.09,59.28-20.81,130.34-19.66,191.72-5.79l7.36,49.38,26.59,175.63c12.38,89.18,24.78,178.34,37.16,267.52,7.83,2.38,15.64,4.79,23.47,7.17.19-2.69.12-5.69-.4-8.93ZM815.71,298.57l-1.74,40.73-22.47-8.95-4.07-42.23,28.28,10.45ZM647.92,139.99c21.21-2.45,42.42-2.52,65.07.43-12.21-7.14-26.02-5.45-38.59-8.88-22.47-.69-43.66,1.79-68.4,5.02,22.24-17.93,42.85-33.43,59.49-54.35.38-1.21,1.9-3.71,3.24-3.62,1.07.07,3.5,1.6,4.55,2.55l47.54,42.83,51.07,44.92c-43.16-10.07-84.09-17.26-125.8-14.88-26,1.5-50.95,6.5-77.75,12.88,19.81-16.5,53.85-23.95,79.59-26.9ZM618.54,273.79c42.95-4.95,86.52-3.71,129.08,3.83l36,9.09-3.5,41.04-34.64-8.38-3-34.16c-.98-2.45.55-6.48-4.64-8.33l-5.1,40.5-41.81-2.81c-2.52-14.24-1.59-27.47-7.02-41.23l-6.55,40.47-42.07,1.02c-2.48-13.97-1.74-27.05-7.19-40.16-5.33,14.83-4.24,27.64-5.76,40.28-.19,1.55-1.74,2.76-4.02,2.12l-37.78,5.14c-2.33-13.76.24-26.76-5.17-41.35-5.1,15.26-4,28.62-5.93,43.02-5.05,2.24-10.21,3.5-15.86,4-1.79-13.5-.24-25.97-5.05-38.12l-5.74,41.9-21.83,8.95-1.52-41.02c32.43-16.24,65.66-21.93,99.09-25.81ZM766.81,355.24c-51.3-12.07-103.54-13.93-155.68-7.24l-63.18,12.83c-12.98,2.64-24.16,8.02-34.4,13.86-1.02-5.98-1.21-12.64,1.02-15.17,1.79-2.02,5.38-4.14,9-5.93,27.93-13.78,57.66-20.07,88.82-23.9,56.42-6.93,112.13-3.24,167.25,10.67,15.4,3.9,29.02,9.76,42,18.26,1.31,5.81,1.83,10.55.24,17.4-17.45-10.55-35.07-16.07-55.07-20.78Z"/>
          <g>
            <path fill="#dcdfe5" d="M609.02,447.99l-29.88,3.98c8.07-5.52,16.28-7.93,23.97-9.55-3.69,3.05-2.31,4,4.14,2.9l1.76,2.67Z"/>
            <path fill="#092a4e" d="M702.06,416.97c-.33.45-.62,1.12-.93,1.86-15.02-.31-29.9.17-44.69,1.43.9-1.24,2.38-2.05,4.57-2.1l41.04-1.19Z"/>
            <polygon fill="#fee25b" points="661.09 248.05 613.4 252.87 613.77 173.37 661.38 170.34 661.09 248.05"/>
            <polygon fill="#fde874" points="720.81 252.04 673.4 248.48 674.21 170.29 720.85 175.09 720.81 252.04"/>
            <polygon fill="#fae363" points="600.41 254.19 575.3 259.3 575.57 181.91 600.06 176.07 600.41 254.19"/>
            <polygon fill="#fde86c" points="758.06 256.89 733.78 253.86 734.27 177.15 758.51 181.6 758.06 256.89"/>
            <g>
              <path fill="#fefffe" d="M607.87,444.37l-4.76-1.95c31.09-6.55,63.42-6.86,94.82-1.26-30.62.79-59.04,2.83-88.92,6.83,10.05-4.9,9.64-6.12-1.14-3.62Z"/>
              <path fill="#fefffe" d="M706.82,569.79l-31.28.71.88-46.97c.24-13.4,6.31-27.14,15.93-27.09,9.24.02,13.55,14.24,13.78,29.24l.69,44.11Z"/>
              <path fill="#fefffe" d="M702.27,416.97h-.21s.02-.02.02-.02c.07,0,.12.02.19.02Z"/>
              <path fill="#0a2b4e" d="M706.82,569.79l-31.28.71.88-46.97c.24-13.4,6.31-27.14,15.93-27.09,9.24.02,13.55,14.24,13.78,29.24l.69,44.11Z"/>
              <path fill="#1b314e" d="M697.94,441.16c-30.62.79-59.04,2.83-88.92,6.83l-29.88,3.98c8.07-5.52,16.28-7.93,23.97-9.55,31.09-6.55,63.42-6.86,94.82-1.26Z"/>
            </g>
          </g>
        </g>
        <g>
          <path fill="#008ac8" d="M462.39,900.42c35.89-7.88,70.44-11.64,106.17-11.32l58.16.52c6.18.06,12.71,4.82,19.67.29-78.34-12.75-158.01-17.14-237.74-5.78l-151.81,27.36c-85.66,15.44-171.58,20.51-256.85,4.83,38.59-2.75,73.72-6.11,110.66-13.71l110.73-25.06c56.05-12.68,110.14-24.04,167.45-30.09,127.31-13.45,272.68,3.78,395.28,41.44,51.01,15.67,100.66,30.83,148.88,53.65-75.34-15.61-148.26-26.36-224.51-24.41l-128.61,10.86-142.54,14.24c-59.8,3.38-117.98,3.31-177.44-8.28l115.07-15.34,87.41-19.19Z"/>
          <path fill="#559e19" d="M799.11,872.41c-68.48-22.53-138.26-37.02-211.1-45.15-50.56-5.65-98.46-8.78-149.02-5.42-52.27,3.47-102.96,6.24-154.1,18.63l-151.99,36.83c-6.95,1.69-12.01,4.05-18.48,3.82,23.29-18.22,49.35-33.77,78.48-42.51l85.54-25.65-20.78-2.53c26.4-27.44,59.66-44.18,94.63-27.18.22-7.94.67-14.23,5.31-19.8,10.34-12.41,29.64-7.26,48.96,1.42-2.72-8.97,1-17.34,1.7-26.41.94-12.18-8.31-21-16.38-29.86,29.39,3.13,57.35,24.21,60.7,54.75,19.92-15.03,40.26-21.08,58.59-4.1,6.64-14.7,17.51-24.78,32.92-28.82,2.39,14.46-2.38,26.83-4.01,41.72,13.49-5.41,27.25-14.14,40.41-8.73,9.56,3.93,10.16,17.5,9.7,26.84l25.76-2.38c31.5-2.91,62.63,1.19,76.16,29.88,27.86,8.89,54.43,19.23,79.51,34.2l27.48,20.44Z"/>
        </g>
      </g>
    </svg>
  )
}

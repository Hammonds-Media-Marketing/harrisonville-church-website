'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Interactive lighthouse, drawn in the brand logo's line-art style — white
 * tapered tower with navy outlines and stripes, gold-lit lantern, starburst
 * rays, scribbled grass, and teal swoosh water strokes, set against a bright
 * daytime sky with soft clouds. The light beam follows
 * the visitor: on devices with a fine pointer (desktop) it tracks the cursor
 * anywhere on screen; on coarse pointers (phones, tablets) it swings with
 * scroll position instead. This is the only interactive part of the hero; the
 * heading, copy, and buttons are server-rendered in the page for SEO.
 *
 * Accessibility / resilience:
 *  - Decorative (aria-hidden) — it conveys no information a reader needs.
 *  - prefers-reduced-motion: the beam holds a calm fixed angle, no tracking.
 */

const LAMP_X = 300
const LAMP_Y = 143

// Keep the beam over the seaward arc so it never points into the ground.
const MIN_ANGLE = -92
const MAX_ANGLE = 26

// Logo line-art palette: brand navy strokes on white, like the logo lockup.
const NAVY = '#13314f'

export function LighthouseScene() {
  const lampRef = useRef<SVGCircleElement>(null)
  const frame = useRef<number | null>(null)
  const [angle, setAngle] = useState(-28)
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
          const lamp = lampRef.current
          if (!lamp) return
          const r = lamp.getBoundingClientRect()
          const cx = r.left + r.width / 2
          const cy = r.top + r.height / 2
          const deg = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI
          setAngle(Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, deg)))
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
        setAngle(-84 + p * 108)
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
      viewBox="0 0 600 520"
      className="h-full w-full"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="beamGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.6" />
          <stop offset="55%" stopColor="var(--color-secondary)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="beamCoreGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-secondary-active)" stopOpacity="0.9" />
          <stop offset="60%" stopColor="var(--color-secondary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Daytime sky — soft drifting clouds */}
      <g fill="#ffffff">
        <g opacity="0.9">
          <ellipse cx="108" cy="80" rx="34" ry="14" />
          <ellipse cx="138" cy="72" rx="24" ry="13" />
          <ellipse cx="84" cy="74" rx="20" ry="11" />
        </g>
        <g opacity="0.75">
          <ellipse cx="470" cy="62" rx="30" ry="12" />
          <ellipse cx="494" cy="55" rx="20" ry="11" />
          <ellipse cx="448" cy="57" rx="16" ry="9" />
        </g>
      </g>

      {/* Rotating beam — pivots at the lamp. A clean cone flanked by straight
          starburst rays, matching the logo's radiating light. */}
      <g
        style={{
          transformOrigin: `${LAMP_X}px ${LAMP_Y}px`,
          transform: `rotate(${angle}deg)`,
          transition: mode !== 'static' ? 'transform 240ms cubic-bezier(0.16,1,0.3,1)' : undefined,
        }}
      >
        <polygon
          points={`${LAMP_X + 8},${LAMP_Y - 10} 612,${LAMP_Y - 138} 626,${LAMP_Y} 612,${LAMP_Y + 138} ${LAMP_X + 8},${LAMP_Y + 10}`}
          fill="url(#beamGrad)"
        />
        <polygon
          points={`${LAMP_X + 8},${LAMP_Y - 6} 600,${LAMP_Y - 54} 610,${LAMP_Y} 600,${LAMP_Y + 54} ${LAMP_X + 8},${LAMP_Y + 6}`}
          fill="url(#beamCoreGrad)"
        />
        <g stroke="var(--color-secondary-active)" strokeWidth="2.5" strokeLinecap="round">
          <line x1="320" y1="129" x2="354" y2="103" opacity="0.9" />
          <line x1="324" y1="135" x2="368" y2="116" opacity="0.75" />
          <line x1="324" y1="151" x2="368" y2="170" opacity="0.75" />
          <line x1="320" y1="157" x2="354" y2="183" opacity="0.9" />
        </g>
      </g>

      {/* Lantern glow */}
      <circle cx={LAMP_X} cy={LAMP_Y} r="52" fill="url(#lampGlow)" />

      {/* Grass knoll — scribbled swoosh like the logo */}
      <path
        d="M192 448 C214 428 248 430 268 440 C288 424 332 424 352 438 C376 426 408 430 424 446 C436 452 432 462 414 464 L206 464 C190 462 184 454 192 448 Z"
        fill="#5f9023"
      />
      <path
        d="M216 452 C246 440 286 442 308 450 C336 440 376 442 400 452"
        fill="none"
        stroke="#4a7118"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Tower — white with navy outline, tapered with a flared base */}
      <path
        d="M281 176 C284 270 276 350 270 398 C268 420 254 430 252 440 L348 440 C346 430 332 420 330 398 C324 350 316 270 319 176 Z"
        fill="#ffffff"
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Thin stripes under the gallery */}
      <g stroke={NAVY} strokeWidth="3.5">
        <line x1="280" y1="200" x2="320" y2="200" />
        <line x1="280" y1="211" x2="320" y2="211" />
        <line x1="279" y1="222" x2="321" y2="222" />
      </g>
      {/* Slit windows */}
      <rect x="296" y="248" width="8" height="16" rx="3.5" fill={NAVY} />
      <rect x="296" y="300" width="8" height="16" rx="3.5" fill={NAVY} />
      {/* Arched door */}
      <path d="M291 440 L291 417 Q300 408 309 417 L309 440 Z" fill={NAVY} />

      {/* Gallery deck with flared corbel band */}
      <path d="M272 178 L328 178 L322 192 L278 192 Z" fill={NAVY} />
      <rect x="262" y="166" width="76" height="12" rx="3" fill={NAVY} />

      {/* Gallery railing */}
      <g stroke={NAVY} strokeLinecap="round">
        <line x1="266" y1="166" x2="266" y2="150" strokeWidth="2.5" />
        <line x1="277" y1="166" x2="277" y2="150" strokeWidth="2" />
        <line x1="288" y1="166" x2="288" y2="150" strokeWidth="2" />
        <line x1="312" y1="166" x2="312" y2="150" strokeWidth="2" />
        <line x1="323" y1="166" x2="323" y2="150" strokeWidth="2" />
        <line x1="334" y1="166" x2="334" y2="150" strokeWidth="2.5" />
        <line x1="263" y1="150" x2="337" y2="150" strokeWidth="3" />
      </g>

      {/* Lantern room — navy frame, gold-lit glass with navy mullions */}
      <rect x="283" y="118" width="34" height="48" fill={NAVY} />
      <rect x="287" y="124" width="26" height="38" rx="2" fill="var(--color-secondary)" />
      <g stroke={NAVY} strokeWidth="2.5">
        <line x1="295.7" y1="124" x2="295.7" y2="162" />
        <line x1="304.3" y1="124" x2="304.3" y2="162" />
      </g>
      {/* Bulb — the beam pivots on this point */}
      <circle ref={lampRef} cx={LAMP_X} cy={LAMP_Y} r="5.5" fill="#fff7e0" />

      {/* Dome roof with finial */}
      <path d="M279 118 Q300 92 321 118 Z" fill={NAVY} />
      <line x1="300" y1="100" x2="300" y2="90" stroke={NAVY} strokeWidth="3" strokeLinecap="round" />
      <circle cx="300" cy="86" r="4" fill={NAVY} />

      {/* Water — layered teal swooshes like the logo */}
      <g fill="none" strokeLinecap="round">
        <path
          d="M70 462 C150 446 240 462 300 456 C380 448 470 466 540 452"
          stroke="#008bbb"
          strokeWidth="9"
          opacity="0.9"
        />
        <path
          d="M40 484 C140 470 250 488 340 478 C420 470 500 486 566 476"
          stroke="#0a6c8c"
          strokeWidth="7"
        />
        <path
          d="M110 504 C200 492 300 506 390 498 C460 492 520 502 560 496"
          stroke="#008bbb"
          strokeWidth="5"
          opacity="0.55"
        />
      </g>
    </svg>
  )
}

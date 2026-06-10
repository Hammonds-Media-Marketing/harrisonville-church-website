'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Interactive lighthouse — the light beam follows the visitor. On devices with
 * a fine pointer (desktop) it tracks the cursor anywhere on screen; on coarse
 * pointers (phones, tablets) it swings with scroll position instead. This is
 * the only interactive part of the hero; the heading, copy, and buttons are
 * server-rendered in the page for SEO.
 *
 * Accessibility / resilience:
 *  - Decorative (aria-hidden) — it conveys no information a reader needs.
 *  - prefers-reduced-motion: the beam holds a calm fixed angle, no tracking.
 */

const LAMP_X = 300
const LAMP_Y = 148

// Keep the beam over the seaward arc so it never points into the ground.
const MIN_ANGLE = -92
const MAX_ANGLE = 26

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
          <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.5" />
          <stop offset="55%" stopColor="var(--color-secondary)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="beamCoreGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff3cf" stopOpacity="0.85" />
          <stop offset="60%" stopColor="var(--color-secondary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lampHaze" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#eef5f9" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#eef5f9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="towerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dbe7ee" />
        </linearGradient>
        {/* Left-to-right shade that rounds the tower into a cylinder. */}
        <linearGradient id="towerShade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0b2538" stopOpacity="0.5" />
          <stop offset="22%" stopColor="#0b2538" stopOpacity="0.12" />
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="78%" stopColor="#0b2538" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0b2538" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a4a6b" />
          <stop offset="100%" stopColor="#0c2438" />
        </linearGradient>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f3251" />
          <stop offset="100%" stopColor="#0b2538" />
        </linearGradient>
        <filter id="beamBlur" x="-15%" y="-40%" width="130%" height="180%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Night sky */}
      <g fill="#eef5f9">
        <circle cx="70" cy="160" r="1.6" opacity="0.7" />
        <circle cx="132" cy="58" r="1.1" opacity="0.5" />
        <circle cx="186" cy="120" r="1.3" opacity="0.65" />
        <circle cx="250" cy="44" r="1.3" opacity="0.6" />
        <circle cx="356" cy="64" r="1" opacity="0.5" />
        <circle cx="430" cy="38" r="1.2" opacity="0.6" />
        <circle cx="476" cy="110" r="1.5" opacity="0.7" />
        <circle cx="520" cy="56" r="1.1" opacity="0.5" />
        <circle cx="556" cy="150" r="1.7" opacity="0.75" />
        <circle cx="396" cy="140" r="1" opacity="0.4" />
        <circle cx="40" cy="80" r="1.2" opacity="0.55" />
        <circle cx="222" cy="86" r="0.9" opacity="0.45" />
      </g>

      {/* Moon, kept clear of the beam's arc */}
      <circle cx="92" cy="76" r="34" fill="url(#moonHalo)" />
      <circle cx="92" cy="76" r="15" fill="#e8eef4" />
      <circle cx="86" cy="71" r="3.4" fill="#cfdbe4" opacity="0.8" />
      <circle cx="98" cy="82" r="2.3" fill="#cfdbe4" opacity="0.7" />
      <circle cx="92" cy="76" r="15" fill="none" stroke="#f7fafc" strokeOpacity="0.4" strokeWidth="1" />

      {/* Atmospheric haze around the lantern */}
      <circle cx={LAMP_X} cy={LAMP_Y} r="130" fill="url(#lampHaze)" />

      {/* Rotating beam — pivots at the lamp. Outer cone is blurred for a soft
          edge; the inner core stays bright like a focused lens. */}
      <g
        style={{
          transformOrigin: `${LAMP_X}px ${LAMP_Y}px`,
          transform: `rotate(${angle}deg)`,
          transition: mode !== 'static' ? 'transform 240ms cubic-bezier(0.16,1,0.3,1)' : undefined,
        }}
      >
        <polygon
          points={`${LAMP_X + 8},${LAMP_Y - 10} 612,${LAMP_Y - 140} 626,${LAMP_Y} 612,${LAMP_Y + 140} ${LAMP_X + 8},${LAMP_Y + 10}`}
          fill="url(#beamGrad)"
          filter="url(#beamBlur)"
        />
        <polygon
          points={`${LAMP_X + 8},${LAMP_Y - 6} 600,${LAMP_Y - 56} 610,${LAMP_Y} 600,${LAMP_Y + 56} ${LAMP_X + 8},${LAMP_Y + 6}`}
          fill="url(#beamCoreGrad)"
        />
      </g>

      {/* Lamp glow halo */}
      <circle cx={LAMP_X} cy={LAMP_Y} r="58" fill="url(#lampGlow)" />

      {/* Island and rocks */}
      <path d="M150 470 Q300 430 450 470 L450 520 L150 520 Z" fill="#143b22" />
      <path d="M170 466 Q300 436 430 466" fill="none" stroke="#1d5630" strokeWidth="3" strokeOpacity="0.6" />
      <path d="M178 470 L208 446 L240 470 Z" fill="#10283a" />
      <path d="M196 470 L218 454 L242 470 Z" fill="#16344a" />
      <path d="M360 470 L388 442 L424 470 Z" fill="#10283a" />
      <path d="M384 470 L404 452 L428 470 Z" fill="#16344a" />

      {/* Tower — tapered with gently curved sides */}
      <g>
        <path d="M278 178 C282 260 270 360 258 432 L342 432 C330 360 318 260 322 178 Z" fill="url(#towerGrad)" />
        {/* Bands (brand navy + teal) follow the taper */}
        <path d="M272 250 L328 250 L331 286 L269 286 Z" fill="#0b2538" />
        <path d="M265 340 L335 340 L338 376 L262 376 Z" fill="#008bbb" />
        {/* Lit portholes */}
        <circle cx="300" cy="222" r="5" fill="#f6d98a" opacity="0.85" />
        <circle cx="300" cy="222" r="5" fill="none" stroke="#0b2538" strokeWidth="2.5" />
        <circle cx="300" cy="312" r="5" fill="#f6d98a" opacity="0.85" />
        <circle cx="300" cy="312" r="5" fill="none" stroke="#0b2538" strokeWidth="2.5" />
        {/* Cylinder shading over the body and bands */}
        <path d="M278 178 C282 260 270 360 258 432 L342 432 C330 360 318 260 322 178 Z" fill="url(#towerShade)" />
      </g>

      {/* Stone base with arched door */}
      <path d="M252 432 L348 432 L356 470 L244 470 Z" fill="#0b2538" />
      <path d="M252 432 L348 432 L349 438 L251 438 Z" fill="#16344a" />
      <path d="M291 468 L291 448 Q300 439 309 448 L309 468 Z" fill="#081c2b" />
      <path d="M291 468 L291 448 Q300 439 309 448 L309 468" fill="none" stroke="#1a4a6b" strokeWidth="1.5" />

      {/* Gallery deck with corbels */}
      <path d="M264 180 L274 180 L272 191 Z" fill="#0b2538" />
      <path d="M326 180 L336 180 L328 191 Z" fill="#0b2538" />
      <rect x="262" y="166" width="76" height="14" rx="3" fill="#0b2538" />
      <rect x="262" y="166" width="76" height="3" rx="1.5" fill="#1a4a6b" />

      {/* Lantern room — glass, mullions, frame */}
      <rect x="282" y="120" width="36" height="46" fill="url(#glassGrad)" />
      <g stroke="#0b2538" strokeWidth="2">
        <line x1="294" y1="120" x2="294" y2="166" />
        <line x1="306" y1="120" x2="306" y2="166" />
        <line x1="282" y1="143" x2="318" y2="143" />
      </g>
      <rect x="282" y="120" width="36" height="46" fill="none" stroke="#0b2538" strokeWidth="3" />
      <line x1="288" y1="126" x2="296" y2="160" stroke="#eef5f9" strokeOpacity="0.18" strokeWidth="3" />

      {/* Gallery railing wraps in front of the lantern */}
      <g stroke="#0b2538" strokeOpacity="0.9">
        <line x1="266" y1="166" x2="266" y2="146" strokeWidth="2" />
        <line x1="274.5" y1="166" x2="274.5" y2="146" strokeWidth="1.5" />
        <line x1="283" y1="166" x2="283" y2="146" strokeWidth="1.5" />
        <line x1="291.5" y1="166" x2="291.5" y2="146" strokeWidth="1.5" />
        <line x1="300" y1="166" x2="300" y2="146" strokeWidth="1.5" />
        <line x1="308.5" y1="166" x2="308.5" y2="146" strokeWidth="1.5" />
        <line x1="317" y1="166" x2="317" y2="146" strokeWidth="1.5" />
        <line x1="325.5" y1="166" x2="325.5" y2="146" strokeWidth="1.5" />
        <line x1="334" y1="166" x2="334" y2="146" strokeWidth="2" />
        <line x1="264" y1="146" x2="336" y2="146" strokeWidth="2.5" />
        <line x1="264" y1="156" x2="336" y2="156" strokeWidth="1.5" />
      </g>

      {/* Lamp — drawn over the railing so the light blooms past it */}
      <circle ref={lampRef} cx={LAMP_X} cy={LAMP_Y} r="11" fill="var(--color-secondary)" />
      <circle cx={LAMP_X} cy={LAMP_Y} r="5" fill="#fff7e0" />
      <line x1={LAMP_X - 2} y1={LAMP_Y - 8} x2={LAMP_X - 2} y2={LAMP_Y + 8} stroke="#fff7e0" strokeOpacity="0.5" strokeWidth="1.5" />

      {/* Dome roof, ventilator, and lightning rod */}
      <path d="M278 120 Q300 94 322 120 Z" fill="#0b2538" />
      <path d="M283 116 Q300 98 317 116" fill="none" stroke="#1a4a6b" strokeWidth="1.5" />
      <rect x="297" y="92" width="6" height="14" rx="2" fill="#0b2538" />
      <circle cx="300" cy="88" r="4" fill="var(--color-secondary)" />
      <line x1="300" y1="84" x2="300" y2="74" stroke="#0b2538" strokeWidth="1.5" />
      <circle cx="300" cy="73" r="1.5" fill="#0b2538" />

      {/* Water with the lamp's reflection */}
      <path d="M0 472 Q150 452 300 472 T600 472 L600 520 L0 520 Z" fill="url(#waterGrad)" />
      <path d="M0 486 Q150 470 300 486 T600 486" fill="none" stroke="#008bbb" strokeOpacity="0.5" strokeWidth="2" />
      <path d="M0 502 Q150 490 300 502 T600 502" fill="none" stroke="#008bbb" strokeOpacity="0.25" strokeWidth="2" />
      <g stroke="var(--color-secondary)" strokeLinecap="round">
        <line x1="288" y1="480" x2="312" y2="480" strokeWidth="3" strokeOpacity="0.5" />
        <line x1="294" y1="488" x2="318" y2="488" strokeWidth="2.5" strokeOpacity="0.38" />
        <line x1="284" y1="496" x2="306" y2="496" strokeWidth="2.5" strokeOpacity="0.3" />
        <line x1="292" y1="505" x2="310" y2="505" strokeWidth="2" strokeOpacity="0.22" />
        <line x1="297" y1="513" x2="315" y2="513" strokeWidth="2" strokeOpacity="0.15" />
      </g>
    </svg>
  )
}

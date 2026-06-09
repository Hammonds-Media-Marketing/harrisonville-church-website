'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Interactive lighthouse — the light beam follows the cursor while the visitor
 * is anywhere on screen. This is the only interactive part of the hero; the
 * heading, copy, and buttons are server-rendered in the page for SEO.
 *
 * Accessibility / resilience:
 *  - Decorative (aria-hidden) — it conveys no information a reader needs.
 *  - prefers-reduced-motion: the beam holds a calm fixed angle, no tracking.
 *  - Coarse pointer (touch) or no pointer: a slow CSS auto-sweep stands in.
 */
export function LighthouseScene() {
  const lampRef = useRef<SVGCircleElement>(null)
  const frame = useRef<number | null>(null)
  const [angle, setAngle] = useState(-28)
  const [mode, setMode] = useState<'track' | 'sweep' | 'static'>('static')

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fine = window.matchMedia('(pointer: fine)').matches
    if (reduce) {
      setMode('static')
      return
    }
    if (!fine) {
      setMode('sweep')
      return
    }
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
        // Clamp to the seaward arc so the beam never points into the ground.
        setAngle(Math.max(-92, Math.min(28, deg)))
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [])

  const LAMP_X = 300
  const LAMP_Y = 150

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
          <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.85" />
          <stop offset="55%" stopColor="var(--color-secondary)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="towerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dbe7ee" />
        </linearGradient>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f3251" />
          <stop offset="100%" stopColor="#0b2538" />
        </linearGradient>
      </defs>

      {/* Stars */}
      <g fill="#eef5f9" opacity="0.7">
        <circle cx="70" cy="60" r="1.6" />
        <circle cx="130" cy="110" r="1.1" />
        <circle cx="500" cy="70" r="1.8" />
        <circle cx="560" cy="140" r="1.2" />
        <circle cx="430" cy="40" r="1.1" />
        <circle cx="250" cy="50" r="1.3" />
      </g>

      {/* Rotating beam — pivots at the lamp. */}
      <g
        style={{
          transformOrigin: `${LAMP_X}px ${LAMP_Y}px`,
          transform: `rotate(${angle}deg)`,
          transition: mode === 'track' ? 'transform 220ms cubic-bezier(0.16,1,0.3,1)' : undefined,
        }}
        className={mode === 'sweep' ? 'animate-beam-sweep' : ''}
      >
        <polygon
          points={`${LAMP_X},${LAMP_Y - 26} 600,${LAMP_Y - 150} 620,${LAMP_Y} 600,${LAMP_Y + 150} ${LAMP_X},${LAMP_Y + 26}`}
          fill="url(#beamGrad)"
        />
      </g>

      {/* Lamp glow halo */}
      <circle cx={LAMP_X} cy={LAMP_Y} r="60" fill="url(#lampGlow)" />

      {/* Lighthouse structure */}
      <g>
        {/* Island */}
        <path d="M150 470 Q300 430 450 470 L450 520 L150 520 Z" fill="#143b22" />
        {/* Tower */}
        <path d="M276 175 L324 175 L338 430 L262 430 Z" fill="url(#towerGrad)" />
        {/* Tower bands (brand navy + teal) */}
        <path d="M268 250 L332 250 L335 285 L265 285 Z" fill="#0b2538" />
        <path d="M262 360 L338 360 L341 395 L259 395 Z" fill="#008bbb" />
        {/* Gallery deck */}
        <rect x="266" y="166" width="68" height="14" rx="3" fill="#0b2538" />
        {/* Lamp room */}
        <rect x="282" y="120" width="36" height="46" rx="4" fill="#0f3251" />
        {/* Lamp light */}
        <circle ref={lampRef} cx={LAMP_X} cy={LAMP_Y} r="11" fill="var(--color-secondary)" />
        <circle cx={LAMP_X} cy={LAMP_Y} r="5" fill="#fff7e0" />
        {/* Roof */}
        <path d="M278 120 L322 120 L300 96 Z" fill="#0b2538" />
        <circle cx="300" cy="92" r="4" fill="var(--color-secondary)" />
        {/* Base */}
        <path d="M256 430 L344 430 L352 470 L248 470 Z" fill="#0b2538" />
      </g>

      {/* Water */}
      <path d="M0 472 Q150 452 300 472 T600 472 L600 520 L0 520 Z" fill="url(#waterGrad)" />
      <path
        d="M0 486 Q150 470 300 486 T600 486"
        fill="none"
        stroke="#008bbb"
        strokeOpacity="0.5"
        strokeWidth="2"
      />
    </svg>
  )
}

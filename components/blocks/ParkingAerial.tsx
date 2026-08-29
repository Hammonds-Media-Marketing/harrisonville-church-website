import Image from 'next/image'

/**
 * ParkingAerial — overhead drone photograph of the building and parking lot
 * with an SVG wayfinding overlay: street labels for 2 Highway and Outlook
 * Drive, plus an arrow tracing the entrance drive from 2 Highway into the
 * lot. The overlay is decorative (aria-hidden) because the same instruction
 * always appears in the surrounding copy and in the image alt text — no
 * information lives only in the graphic. Label pills and the arrow use the
 * deep-navy / on-deep / gold token pairings already covered by the contrast
 * gate, so the labels stay readable regardless of what the photo shows
 * beneath them.
 *
 * The viewBox matches the source photograph's pixel grid (2880 × 2585), so
 * overlay coordinates map 1:1 onto features in the original image.
 */

export function ParkingAerial({
  sizes = '(max-width: 1024px) 100vw, 38vw',
  className = '',
}: {
  sizes?: string
  className?: string
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <Image
        src="/assets/photos/aerial-parking-entrance.jpg"
        alt="Overhead aerial photo of the church building and parking lot. Outlook Drive runs along the left side of the property and 2 Highway runs along the bottom. An arrow marks the parking lot entrance, a driveway off 2 Highway near the corner of 2 Highway and Outlook Drive."
        width={1600}
        height={1436}
        loading="lazy"
        sizes={sizes}
        className="photo-grade h-auto w-full"
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 2880 2585"
        className="absolute inset-0 h-full w-full"
        style={{ fontSize: 112, letterSpacing: '0.02em' }}
      >
        <defs>
          <marker
            id="parking-arrowhead"
            viewBox="0 0 12 12"
            refX="9"
            refY="6"
            markerWidth="5.5"
            markerHeight="5.5"
            orient="auto"
          >
            <path
              d="M1 1 L11 6 L1 11 Z"
              fill="var(--color-secondary)"
              stroke="var(--color-surface-deep)"
              strokeWidth="1.5"
            />
          </marker>
        </defs>

        {/* Entrance route: east along 2 Highway, then up the drive into the
            lot. A wide navy casing sits under the gold line so the arrow
            holds contrast over both pavement and grass. */}
        <path
          d="M 1210 2390 L 2140 2390 C 2330 2390 2430 2340 2430 2170 C 2430 2010 2390 1890 2280 1820"
          fill="none"
          stroke="var(--color-surface-deep)"
          strokeWidth="62"
          strokeLinecap="round"
        />
        <path
          d="M 1210 2390 L 2140 2390 C 2330 2390 2430 2340 2430 2170 C 2430 2010 2390 1890 2280 1820"
          fill="none"
          stroke="var(--color-secondary)"
          strokeWidth="30"
          strokeLinecap="round"
          markerEnd="url(#parking-arrowhead)"
        />

        {/* Street label: 2 Highway, on the highway along the bottom edge. */}
        <g>
          <rect x="260" y="2300" width="860" height="176" rx="26" fill="var(--color-surface-deep)" opacity="0.94" />
          <text
            x="690"
            y="2402"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--color-on-deep)"
            fontWeight="600"
          >
            2 Highway
          </text>
        </g>

        {/* Street label: Outlook Drive, rotated along the road on the left. */}
        <g transform="translate(378 1080) rotate(-90)">
          <rect x="-560" y="-88" width="1120" height="176" rx="26" fill="var(--color-surface-deep)" opacity="0.94" />
          <text
            x="0"
            y="14"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--color-on-deep)"
            fontWeight="600"
          >
            Outlook Drive
          </text>
        </g>

        {/* Destination label inside the lot, where the arrow lands. */}
        <g>
          <rect x="1280" y="1450" width="1320" height="176" rx="26" fill="var(--color-surface-deep)" opacity="0.94" />
          <text
            x="1940"
            y="1552"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--color-on-deep)"
            fontWeight="600"
          >
            Parking entrance
          </text>
        </g>
      </svg>
    </div>
  )
}

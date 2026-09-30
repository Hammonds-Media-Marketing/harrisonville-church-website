import Script from 'next/script'

// GA4 measurement ID for harrisonvillecoc.com. Public by design (it ships in the
// page source); NEXT_PUBLIC_GA4_ID overrides it, and setting that to an empty
// string disables GA4 (e.g. for a preview environment).
const DEFAULT_GA4_ID = 'G-9KVFGML4WG'

/**
 * Analytics — GA4 and Mixpanel. GA4 loads with the site's measurement ID unless
 * overridden; Mixpanel loads only when its token is configured. `afterInteractive`
 * keeps these off the critical path.
 */
export function Analytics() {
  const ga = process.env.NEXT_PUBLIC_GA4_ID ?? DEFAULT_GA4_ID
  const mixpanel = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN

  return (
    <>
      {ga ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ga}', { anonymize_ip: true });`}
          </Script>
        </>
      ) : null}

      {mixpanel ? (
        <>
          <Script
            src="https://cdn.jsdelivr.net/npm/mixpanel-browser@2/dist/mixpanel.min.js"
            strategy="afterInteractive"
          />
          <Script id="mixpanel-init" strategy="afterInteractive">
            {`if (window.mixpanel && window.mixpanel.init) { window.mixpanel.init('${mixpanel}', { track_pageview: true, persistence: 'localStorage' }); }`}
          </Script>
        </>
      ) : null}
    </>
  )
}

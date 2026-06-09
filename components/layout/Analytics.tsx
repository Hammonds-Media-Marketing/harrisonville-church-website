import Script from 'next/script'

/**
 * Analytics — GA4 and Mixpanel, loaded only when their IDs are configured via
 * environment variables. With no IDs set (the current state), nothing loads, so
 * the site ships clean until the accounts are provisioned. `afterInteractive`
 * keeps these off the critical path.
 */
export function Analytics() {
  const ga = process.env.NEXT_PUBLIC_GA4_ID
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

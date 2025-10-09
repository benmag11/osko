'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

type GtagParameters = {
  page_path?: string
  event_category?: string
  event_label?: string
  value?: number
  [key: string]: string | number | boolean | undefined
}

declare global {
  interface Window {
    gtag: (
      type: string,
      action: string,
      parameters?: GtagParameters
    ) => void
    dataLayer: Array<unknown>
  }
}

// Helper function to track events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  // Track page views on route changes
  useEffect(() => {
    if (!measurementId || typeof window === 'undefined' || !window.gtag) {
      return
    }

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')

    // Send page view event to Google Analytics
    window.gtag('config', measurementId, {
      page_path: url,
    })
  }, [pathname, searchParams, measurementId])

  if (!measurementId) {
    console.warn('Google Analytics measurement ID is not configured')
    return null
  }

  return (
    <>
      {/* Google Analytics Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
}
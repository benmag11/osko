'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

interface PendingNavigation {
  target: string
  markId: string
}

function resolveTarget(href: string): string {
  if (typeof window === 'undefined') {
    return href
  }

  try {
    const url = new URL(href, window.location.origin)
    return url.pathname + url.search
  } catch {
    return href
  }
}

export function useNavigationMetrics() {
  const router = useRouter()
  const pathname = usePathname()
  const pendingRef = useRef<PendingNavigation | null>(null)

  const markNavigation = useCallback((href: string) => {
    if (typeof performance === 'undefined') {
      return
    }

    const target = resolveTarget(href)
    const markId = `nav:start:${target}:${Date.now()}`
    performance.mark(markId)
    pendingRef.current = { target, markId }
  }, [])

  const push = useCallback((href: string) => {
    markNavigation(href)
    router.push(href)
  }, [markNavigation, router])

  const replace = useCallback((href: string) => {
    markNavigation(href)
    router.replace(href)
  }, [markNavigation, router])

  useEffect(() => {
    if (typeof performance === 'undefined' || typeof window === 'undefined') {
      return
    }

    const pending = pendingRef.current
    if (!pending) {
      return
    }

    const current = window.location.pathname + window.location.search
    if (current !== pending.target && pathname !== pending.target) {
      return
    }

    const endMark = `nav:end:${pending.target}:${Date.now()}`
    performance.mark(endMark)
    const measureName = `nav:${pending.target}`
    performance.measure(measureName, pending.markId, endMark)

    const measurements = performance.getEntriesByName(measureName)
    const latest = measurements.at(-1)
    if (latest) {
      console.debug(
        `[nav] ${pending.target}`,
        `${latest.duration.toFixed(1)}ms`
      )
    }

    performance.clearMarks(pending.markId)
    performance.clearMarks(endMark)
    performance.clearMeasures(measureName)
    pendingRef.current = null
  }, [pathname])

  return {
    push,
    replace,
    markNavigation,
  }
}

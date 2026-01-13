'use client'

import { trackEvent } from '@/components/analytics'

interface ImageLoadMetric {
  imageType: 'question' | 'marking_scheme'
  loadTimeMs: number
  imageUrl: string
  questionId?: string
  wasPrefetched: boolean
  timestamp: number
}

const BATCH_SIZE = 5
const FLUSH_INTERVAL_MS = 10000

let metricsBatch: ImageLoadMetric[] = []
let flushTimeout: ReturnType<typeof setTimeout> | null = null

function flushMetrics() {
  if (metricsBatch.length === 0) return

  const batch = [...metricsBatch]
  metricsBatch = []

  if (flushTimeout) {
    clearTimeout(flushTimeout)
    flushTimeout = null
  }

  const questionImages = batch.filter((m) => m.imageType === 'question')
  const markingSchemes = batch.filter((m) => m.imageType === 'marking_scheme')

  if (questionImages.length > 0) {
    const avgLoadTime = Math.round(
      questionImages.reduce((sum, m) => sum + m.loadTimeMs, 0) /
        questionImages.length
    )
    const maxLoadTime = Math.round(
      Math.max(...questionImages.map((m) => m.loadTimeMs))
    )

    trackEvent(
      'image_load_time',
      'Performance',
      'question_image_avg',
      avgLoadTime
    )
    trackEvent(
      'image_load_time',
      'Performance',
      'question_image_max',
      maxLoadTime
    )

    questionImages
      .filter((m) => m.loadTimeMs > 3000)
      .forEach((m) => {
        trackEvent(
          'slow_image_load',
          'Performance',
          'question_image',
          Math.round(m.loadTimeMs)
        )
      })
  }

  if (markingSchemes.length > 0) {
    const avgLoadTime = Math.round(
      markingSchemes.reduce((sum, m) => sum + m.loadTimeMs, 0) /
        markingSchemes.length
    )
    const prefetchedCount = markingSchemes.filter((m) => m.wasPrefetched).length

    trackEvent(
      'image_load_time',
      'Performance',
      'marking_scheme_avg',
      avgLoadTime
    )
    trackEvent(
      'prefetch_effectiveness',
      'Performance',
      'marking_scheme',
      Math.round((prefetchedCount / markingSchemes.length) * 100)
    )

    markingSchemes
      .filter((m) => m.loadTimeMs > 3000)
      .forEach((m) => {
        trackEvent(
          'slow_image_load',
          'Performance',
          'marking_scheme',
          Math.round(m.loadTimeMs)
        )
      })
  }
}

export function recordImageLoadMetric(
  metric: Omit<ImageLoadMetric, 'timestamp'>
) {
  metricsBatch.push({ ...metric, timestamp: Date.now() })

  if (metricsBatch.length >= BATCH_SIZE) {
    flushMetrics()
    return
  }

  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushTimeout = null
      flushMetrics()
    }, FLUSH_INTERVAL_MS)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (flushTimeout) clearTimeout(flushTimeout)
    flushMetrics()
  })
}

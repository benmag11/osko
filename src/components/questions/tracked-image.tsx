'use client'

import { useCallback, useRef } from 'react'
import Image, { type ImageProps } from 'next/image'
import { recordImageLoadMetric } from '@/lib/metrics/image-metrics'

// Static blur placeholder - cream color matching page background (cream-50)
// This provides instant visual feedback while the optimized image loads
const BLUR_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4////fwYAAwAB/ujLXkYAAAAASUVORK5CYII='

interface TrackedImageProps extends Omit<ImageProps, 'placeholder' | 'blurDataURL'> {
  imageType: 'question' | 'marking_scheme'
  questionId?: string
  wasPrefetched?: boolean
}

export function TrackedImage({
  imageType,
  questionId,
  wasPrefetched = false,
  onLoad,
  ...props
}: TrackedImageProps) {
  const startTimeRef = useRef<number>(performance.now())
  const hasReportedRef = useRef(false)

  const handleLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (hasReportedRef.current) return
      hasReportedRef.current = true

      const loadTimeMs = performance.now() - startTimeRef.current

      recordImageLoadMetric({
        imageType,
        loadTimeMs,
        imageUrl:
          typeof props.src === 'string' ? props.src : 'next-image-object',
        questionId,
        wasPrefetched,
      })

      if (onLoad) {
        onLoad(event)
      }
    },
    [imageType, questionId, wasPrefetched, props.src, onLoad]
  )

  return (
    <Image
      {...props}
      placeholder="blur"
      blurDataURL={BLUR_PLACEHOLDER}
      onLoad={handleLoad}
    />
  )
}

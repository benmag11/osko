'use client'

import { useCallback, useRef } from 'react'
import Image, { type ImageProps } from 'next/image'
import { recordImageLoadMetric } from '@/lib/metrics/image-metrics'

interface TrackedImageProps extends ImageProps {
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

  return <Image {...props} onLoad={handleLoad} />
}

'use client'

import { useInView } from 'react-intersection-observer'
import { useEffect, useRef } from 'react'
import type { Question } from '@/lib/types/database'

interface PreloadedImage {
  questionId: string
  url: string
  linkElement: HTMLLinkElement | null
}

/**
 * Hook to preload marking scheme images for questions visible in viewport
 * Uses Intersection Observer to detect visibility and browser-native preloading
 */
export function useMarkingSchemePreload() {
  const preloadedImages = useRef<Map<string, PreloadedImage>>(new Map())

  /**
   * Create a ref and visibility state for a question card
   * When the question enters viewport, its marking scheme will be preloaded
   */
  const getQuestionRef = (question: Question | null) => {
    const { ref, inView } = useInView({
      threshold: 0,
      rootMargin: '200px', // Start preloading 200px before entering viewport
      triggerOnce: false, // Keep tracking as user scrolls up/down
    })

    useEffect(() => {
      if (!question?.marking_scheme_image_url || !inView) {
        // Remove preload if question leaves viewport
        if (question && !inView) {
          const preloaded = preloadedImages.current.get(question.id)
          if (preloaded?.linkElement) {
            preloaded.linkElement.remove()
            preloadedImages.current.delete(question.id)
          }
        }
        return
      }

      // Check if already preloaded
      if (preloadedImages.current.has(question.id)) {
        return
      }

      // Check if URL is valid
      const url = question.marking_scheme_image_url
      if (url === 'placeholder' || (!url.startsWith('http') && !url.startsWith('/'))) {
        return
      }

      // Create preload link element
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url

      // Add to document head for browser preloading
      document.head.appendChild(link)

      // Track preloaded image
      preloadedImages.current.set(question.id, {
        questionId: question.id,
        url,
        linkElement: link,
      })

      // Cleanup function
      return () => {
        const preloaded = preloadedImages.current.get(question.id)
        if (preloaded?.linkElement) {
          preloaded.linkElement.remove()
          preloadedImages.current.delete(question.id)
        }
      }
    }, [question, inView])

    return ref
  }

  // Cleanup all preloads on unmount
  useEffect(() => {
    return () => {
      preloadedImages.current.forEach(preloaded => {
        if (preloaded.linkElement) {
          preloaded.linkElement.remove()
        }
      })
      preloadedImages.current.clear()
    }
  }, [])

  return { getQuestionRef }
}
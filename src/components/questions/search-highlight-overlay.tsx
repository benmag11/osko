import { memo, useMemo } from 'react'
import { findMatchingWords } from '@/lib/utils/search-highlight'
import type { WordCoordinatesData } from '@/lib/types/database'

interface SearchHighlightOverlayProps {
  wordCoordinates: WordCoordinatesData | null | undefined
  searchTerms: string[] | undefined
  naturalWidth: number
  naturalHeight: number
}

export const SearchHighlightOverlay = memo(function SearchHighlightOverlay({
  wordCoordinates,
  searchTerms,
  naturalWidth,
  naturalHeight,
}: SearchHighlightOverlayProps) {
  const highlights = useMemo(
    () => findMatchingWords(wordCoordinates, searchTerms),
    [wordCoordinates, searchTerms]
  )

  if (highlights.length === 0) return null

  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none"
      viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
      preserveAspectRatio="xMinYMin meet"
      aria-hidden="true"
    >
      {highlights.map((rect, i) => (
        <rect
          key={i}
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          rx={4}
          ry={4}
          fill="rgba(253, 186, 116, 0.35)"
          stroke="rgba(251, 146, 60, 0.5)"
          strokeWidth={2}
        />
      ))}
    </svg>
  )
})

import type { WordCoordinatesData } from '@/lib/types/database'

export interface HighlightRect {
  x: number
  y: number
  width: number
  height: number
}

const PADDING = 12

/**
 * Strip leading/trailing punctuation from OCR text so that
 * "womb.", "formed?", "(cell)" etc. match their root words.
 */
function stripPunctuation(text: string): string {
  return text.replace(/^[^\w]+|[^\w]+$/g, '')
}

/**
 * Find word coordinates that match any of the given search terms.
 *
 * Uses forward substring matching:
 * - word.includes(term)  → "proved" matches search "prove"
 *
 * Returns highlight rectangles in natural image pixel coordinates.
 */
export function findMatchingWords(
  wordCoordinates: WordCoordinatesData | null | undefined,
  searchTerms: string[] | undefined
): HighlightRect[] {
  if (!wordCoordinates?.words?.length || !searchTerms?.length) {
    return []
  }

  const lowerTerms = searchTerms
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0)

  if (lowerTerms.length === 0) return []

  const highlights: HighlightRect[] = []

  for (const word of wordCoordinates.words) {
    const cleaned = stripPunctuation(word.text).toLowerCase()
    if (cleaned.length === 0) continue

    const isMatch = lowerTerms.some(
      (term) => cleaned.includes(term)
    )

    if (isMatch) {
      highlights.push({
        x: word.bbox.x - PADDING,
        y: word.bbox.y - PADDING,
        width: word.bbox.w + PADDING * 2,
        height: word.bbox.h + PADDING * 2,
      })
    }
  }

  return highlights
}

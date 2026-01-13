import type { ImageLoaderProps } from 'next/image'

// Pattern to match Supabase storage URLs
// Captures: [1] = project ID, [2] = bucket/path
const SUPABASE_STORAGE_PATTERN =
  /^https:\/\/([^.]+)\.supabase\.co\/storage\/v1\/object\/public\/(.+)$/

/**
 * Parse a full Supabase storage URL into project ID and path
 * Returns null if URL doesn't match expected pattern
 *
 * @example
 * parseSupabaseStorageUrl('https://abc123.supabase.co/storage/v1/object/public/images/photo.jpg')
 * // => { projectId: 'abc123', path: 'images/photo.jpg' }
 */
export function parseSupabaseStorageUrl(
  url: string
): { projectId: string; path: string } | null {
  const match = url.match(SUPABASE_STORAGE_PATTERN)
  if (!match) return null
  return {
    projectId: match[1],
    path: match[2], // includes bucket name and file path
  }
}

/**
 * Check if a URL is a Supabase storage URL
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return SUPABASE_STORAGE_PATTERN.test(url)
}

/**
 * Custom image loader for Next.js that uses Supabase Image Transformations
 *
 * This loader transforms Supabase storage URLs to use the /render/image/ endpoint
 * which provides server-side resizing, quality optimization, and CDN caching.
 *
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations
 *
 * Handles full Supabase URLs:
 * - Input: https://xxx.supabase.co/storage/v1/object/public/bucket/path
 * - Output: https://xxx.supabase.co/storage/v1/render/image/public/bucket/path?width=X&quality=Y
 */
export default function supabaseLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  // Parse the full Supabase URL
  const parsed = parseSupabaseStorageUrl(src)

  if (parsed) {
    // Construct the transformation URL
    // resize=contain preserves aspect ratio without cropping (essential for varying image heights)
    return `https://${parsed.projectId}.supabase.co/storage/v1/render/image/public/${parsed.path}?width=${width}&quality=${quality || 75}&resize=contain`
  }

  // If not a Supabase URL, return as-is (fallback for local images, etc.)
  return src
}

/**
 * Generate a transformed URL for a specific width/quality
 * Useful for prefetching or manual URL construction
 */
export function getTransformedImageUrl(
  src: string,
  width: number,
  quality: number = 75
): string {
  return supabaseLoader({ src, width, quality })
}

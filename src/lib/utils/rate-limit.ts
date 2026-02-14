import { createServerSupabaseClient } from '@/lib/supabase/server'

const DEFAULT_WINDOW_SECONDS = 3600 // 1 hour
const DEFAULT_MAX_REQUESTS = 5

/**
 * Check whether a request from the given IP is allowed under the rate limit.
 * Uses a Supabase RPC function (`check_rate_limit`) backed by the
 * `rate_limit_entries` table for persistence across cold starts.
 *
 * @returns `true` if the request is allowed, `false` if rate-limited.
 */
export async function checkRateLimit(
  ip: string,
  action: string,
  options?: { windowSeconds?: number; maxRequests?: number }
): Promise<boolean> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_ip: ip,
    p_action: action,
    p_window_seconds: options?.windowSeconds ?? DEFAULT_WINDOW_SECONDS,
    p_max_requests: options?.maxRequests ?? DEFAULT_MAX_REQUESTS,
  })

  if (error) {
    console.error('Rate limit check failed:', error)
    // Fail open — allow the request if the rate limiter itself errors
    return true
  }

  return data as boolean
}

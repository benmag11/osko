import { useCallback, useEffect, useRef } from 'react'

/**
 * Custom hook for managing timeouts with automatic cleanup
 * Prevents memory leaks by clearing all timeouts on unmount
 * 
 * @returns setSafeTimeout function that works like setTimeout but with automatic cleanup
 */
export function useSafeTimeout() {
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set())

  const setSafeTimeout = useCallback((callback: () => void, delay: number): NodeJS.Timeout => {
    const timeoutId = setTimeout(() => {
      timeoutsRef.current.delete(timeoutId)
      callback()
    }, delay)
    
    timeoutsRef.current.add(timeoutId)
    return timeoutId
  }, [])

  const clearSafeTimeout = useCallback((timeoutId: NodeJS.Timeout) => {
    clearTimeout(timeoutId)
    timeoutsRef.current.delete(timeoutId)
  }, [])

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current.clear()
  }, [])

  // Cleanup all timeouts on unmount
  useEffect(() => {
    const timeouts = timeoutsRef.current
    return () => {
      timeouts.forEach(clearTimeout)
      timeouts.clear()
    }
  }, [])

  return { setSafeTimeout, clearSafeTimeout, clearAllTimeouts }
}
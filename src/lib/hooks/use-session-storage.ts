'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseSessionStorageOptions<T> {
  key: string
  defaultValue: T
  validator?: (value: unknown) => value is T
}

export function useSessionStorage<T>({
  key,
  defaultValue,
  validator,
}: UseSessionStorageOptions<T>): [T, (value: T) => void, boolean] {
  // Initialize with default value
  const [storedValue, setStoredValue] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)
  const [isAvailable, setIsAvailable] = useState(false)

  // Check storage availability and load initial value
  useEffect(() => {
    // SSR safety check
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    // Check if sessionStorage is available
    try {
      const testKey = '__test__'
      window.sessionStorage.setItem(testKey, 'test')
      window.sessionStorage.removeItem(testKey)
      setIsAvailable(true)

      // Try to load existing value
      const item = window.sessionStorage.getItem(key)
      if (item !== null) {
        const parsed = JSON.parse(item)

        // Validate the parsed value if validator provided
        if (!validator || validator(parsed)) {
          setStoredValue(parsed)
        } else {
          // Invalid data, clear it
          window.sessionStorage.removeItem(key)
        }
      }
    } catch (error) {
      // Storage not available or data corrupted
      console.warn(`SessionStorage not available or corrupted for key "${key}":`, error)
      setIsAvailable(false)
    } finally {
      setIsLoading(false)
    }
  }, [key, defaultValue, validator])

  // Memoized setter function
  const setValue = useCallback((value: T) => {
    setStoredValue(value)

    // Only write to storage if available
    if (typeof window !== 'undefined' && isAvailable) {
      try {
        window.sessionStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.warn(`Failed to save to sessionStorage key "${key}":`, error)
        // Continue with in-memory value even if storage fails
      }
    }
  }, [key, isAvailable])

  return [storedValue, setValue, isLoading]
}
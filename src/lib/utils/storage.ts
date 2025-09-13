export function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  if (typeof window === 'undefined') return false

  try {
    const storage = window[type]
    const testKey = '__storage_test__'
    storage.setItem(testKey, 'test')
    storage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export function safeJsonParse<T>(
  value: string,
  fallback: T,
  validator?: (value: unknown) => value is T
): T {
  try {
    const parsed = JSON.parse(value)
    return validator && !validator(parsed) ? fallback : parsed
  } catch {
    return fallback
  }
}
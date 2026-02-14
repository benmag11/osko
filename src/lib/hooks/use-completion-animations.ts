import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'completion-animations-enabled'

type Listener = () => void

const listeners = new Set<Listener>()

let cachedValue: boolean | null = null

function getSnapshot(): boolean {
  if (cachedValue === null) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      cachedValue = stored === null ? true : stored === 'true'
    } catch {
      cachedValue = true
    }
  }
  return cachedValue
}

function getServerSnapshot(): boolean {
  return true
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function setAnimationsEnabled(enabled: boolean) {
  cachedValue = enabled
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled))
  } catch {
    // localStorage unavailable — in-memory cache still works for the session
  }
  listeners.forEach((listener) => listener())
}

export function useCompletionAnimations() {
  const animationsEnabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return { animationsEnabled, setAnimationsEnabled } as const
}

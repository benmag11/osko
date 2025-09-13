'use client'

import { createContext, useContext, useEffect, useCallback, useMemo } from 'react'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { useSessionStorage } from '@/lib/hooks/use-session-storage'

interface ZoomContextValue {
  zoomLevel: number
  setZoomLevel: (level: number) => void
  increaseZoom: () => void
  decreaseZoom: () => void
  resetZoom: () => void
  isEnabled: boolean
  isLoading: boolean
}

const ZoomContext = createContext<ZoomContextValue | undefined>(undefined)

const ZOOM_LEVELS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0] as const
type ZoomLevel = typeof ZOOM_LEVELS[number]

const STORAGE_KEY = 'exam-viewer-zoom'
const DEFAULT_ZOOM: ZoomLevel = 1.0

// Type guard for zoom level validation
function isValidZoomLevel(value: unknown): value is ZoomLevel {
  return typeof value === 'number' && ZOOM_LEVELS.includes(value as ZoomLevel)
}

export function ZoomProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const isEnabled = isMobile === false // Only enable on desktop

  // Use sessionStorage hook with validation
  const [zoomLevel, setStoredZoom, isLoading] = useSessionStorage<ZoomLevel>({
    key: STORAGE_KEY,
    defaultValue: DEFAULT_ZOOM,
    validator: isValidZoomLevel,
  })

  // Memoized zoom control functions
  const setZoomLevel = useCallback((level: number) => {
    if (!isEnabled) return
    // Validate the level is a valid zoom level
    if (isValidZoomLevel(level)) {
      setStoredZoom(level)
    }
  }, [isEnabled, setStoredZoom])

  const increaseZoom = useCallback(() => {
    if (!isEnabled) return

    const currentIndex = ZOOM_LEVELS.indexOf(zoomLevel)
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoomLevel(ZOOM_LEVELS[currentIndex + 1])
    }
  }, [isEnabled, zoomLevel, setZoomLevel])

  const decreaseZoom = useCallback(() => {
    if (!isEnabled) return

    const currentIndex = ZOOM_LEVELS.indexOf(zoomLevel)
    if (currentIndex > 0) {
      setZoomLevel(ZOOM_LEVELS[currentIndex - 1])
    }
  }, [isEnabled, zoomLevel, setZoomLevel])

  const resetZoom = useCallback(() => {
    if (!isEnabled) return
    setZoomLevel(DEFAULT_ZOOM)
  }, [isEnabled, setZoomLevel])

  // Keyboard shortcuts (desktop only)
  useEffect(() => {
    if (!isEnabled || isLoading) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for modifier keys
      if (!(e.metaKey || e.ctrlKey)) return

      switch (e.key) {
        case '=':
        case '+':
          e.preventDefault()
          increaseZoom()
          break
        case '-':
          e.preventDefault()
          decreaseZoom()
          break
        case '0':
          e.preventDefault()
          resetZoom()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEnabled, isLoading, increaseZoom, decreaseZoom, resetZoom])

  // Memoized context value
  const contextValue = useMemo<ZoomContextValue>(() => ({
    zoomLevel: isEnabled && !isLoading ? zoomLevel : DEFAULT_ZOOM,
    setZoomLevel,
    increaseZoom,
    decreaseZoom,
    resetZoom,
    isEnabled,
    isLoading: isEnabled ? isLoading : false,
  }), [zoomLevel, setZoomLevel, increaseZoom, decreaseZoom, resetZoom, isEnabled, isLoading])

  return (
    <ZoomContext.Provider value={contextValue}>
      {children}
    </ZoomContext.Provider>
  )
}

export function useZoom() {
  const context = useContext(ZoomContext)
  if (!context) {
    throw new Error('useZoom must be used within ZoomProvider')
  }
  return context
}
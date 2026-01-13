'use client'

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  useMemo,
  type ReactNode,
} from 'react'
import { useFilters } from './filter-provider'
import {
  useAudioNavigationList,
  type AudioQuestionNavigationItem,
} from '@/lib/hooks/use-audio-navigation-list'

// Zoom constants
const MAX_ZOOM = 1
const MIN_ZOOM = 0.5
const ZOOM_STEP = 0.1

type NavigationHandler = (item: AudioQuestionNavigationItem) => void | Promise<void>
type ZoomHandler = () => void

interface NavigationTarget {
  id: string
  title: string
}

interface AudioNavigationContextValue {
  // Navigation items from the query
  items: AudioQuestionNavigationItem[]
  totalCount: number
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => void
  idToIndex: Map<string, number>

  // Active question state
  activeQuestionId: string | null
  setActiveQuestionId: (id: string | null) => void
  activeIndex: number | null

  // Navigation state
  isNavigating: boolean
  setIsNavigating: (isNavigating: boolean) => void

  // Navigation target (for "Jumping to [title]" display)
  navigationTarget: NavigationTarget | null
  setNavigationTarget: (target: NavigationTarget | null) => void

  // Returning state (when sidebar scrolls to bring active question into view)
  isReturning: boolean
  setIsReturning: (isReturning: boolean) => void

  // Handler registration (called by FilteredAudioView)
  registerNavigationHandler: (handler: NavigationHandler) => void

  // Handler for sidebar panel to call
  handleQuestionSelect: (item: AudioQuestionNavigationItem) => void | Promise<void>

  // Zoom state
  zoom: number
  canZoomIn: boolean
  canZoomOut: boolean

  // Zoom handler registration (called by FilteredAudioView for anchor preservation)
  registerZoomHandler: (handler: ZoomHandler) => void

  // Zoom handlers for sidebar to call
  handleZoomIn: () => void
  handleZoomOut: () => void
}

const AudioNavigationContext = createContext<AudioNavigationContextValue | null>(null)

/**
 * Hook to access audio navigation context
 * Provides navigation list, active question state, and zoom controls
 */
export function useAudioNavigation() {
  const context = useContext(AudioNavigationContext)
  if (!context) {
    throw new Error('useAudioNavigation must be used within AudioNavigationProvider')
  }
  return context
}

interface AudioNavigationProviderProps {
  children: ReactNode
}

/**
 * Provider for audio question navigation
 *
 * Similar to QuestionNavigationProvider but:
 * - Uses audio-specific navigation list hook
 * - Connected to audio questions via AudioFilters (no questionNumbers)
 */
export function AudioNavigationProvider({ children }: AudioNavigationProviderProps) {
  const { filters } = useFilters()

  // Navigation list query
  const {
    items,
    totalCount,
    isLoading,
    isFetching,
    error,
    refetch,
    idToIndex,
  } = useAudioNavigationList(filters)

  // Active question state
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)

  // Navigation target state (for "Jumping to [title]" display)
  const [navigationTarget, setNavigationTarget] = useState<NavigationTarget | null>(null)

  // Returning state (controlled by jump-to-question-panel when sidebar scrolls)
  const [isReturning, setIsReturning] = useState(false)

  // Zoom state
  const [zoom, setZoom] = useState(MAX_ZOOM)

  // Compute active index from activeQuestionId
  const activeIndex = useMemo(() => {
    if (!activeQuestionId) return null
    return idToIndex.get(activeQuestionId) ?? null
  }, [activeQuestionId, idToIndex])

  // Computed zoom constraints
  const canZoomIn = zoom < MAX_ZOOM - 0.0001
  const canZoomOut = zoom > MIN_ZOOM + 0.0001

  // Handler registration ref
  const navigationHandlerRef = useRef<NavigationHandler | null>(null)

  const registerNavigationHandler = useCallback((handler: NavigationHandler) => {
    navigationHandlerRef.current = handler
  }, [])

  const handleQuestionSelect = useCallback((item: AudioQuestionNavigationItem) => {
    if (navigationHandlerRef.current) {
      return navigationHandlerRef.current(item)
    }
    // Fallback: just set the active question (won't scroll)
    setActiveQuestionId(item.id)
  }, [])

  // Zoom handler registration ref (for anchor preservation in FilteredAudioView)
  const zoomHandlerRef = useRef<ZoomHandler | null>(null)

  const registerZoomHandler = useCallback((handler: ZoomHandler) => {
    zoomHandlerRef.current = handler
  }, [])

  const handleZoomIn = useCallback(() => {
    if (!canZoomIn) return
    // Call the registered handler first (captures anchor)
    zoomHandlerRef.current?.()
    // Then update zoom
    setZoom((current) => Math.round((current + ZOOM_STEP) * 100) / 100)
  }, [canZoomIn])

  const handleZoomOut = useCallback(() => {
    if (!canZoomOut) return
    // Call the registered handler first (captures anchor)
    zoomHandlerRef.current?.()
    // Then update zoom
    setZoom((current) => Math.round((current - ZOOM_STEP) * 100) / 100)
  }, [canZoomOut])

  const value = useMemo<AudioNavigationContextValue>(() => ({
    items,
    totalCount,
    isLoading,
    isFetching,
    error,
    refetch,
    idToIndex,
    activeQuestionId,
    setActiveQuestionId,
    activeIndex,
    isNavigating,
    setIsNavigating,
    navigationTarget,
    setNavigationTarget,
    isReturning,
    setIsReturning,
    registerNavigationHandler,
    handleQuestionSelect,
    zoom,
    canZoomIn,
    canZoomOut,
    registerZoomHandler,
    handleZoomIn,
    handleZoomOut,
  }), [
    items,
    totalCount,
    isLoading,
    isFetching,
    error,
    refetch,
    idToIndex,
    activeQuestionId,
    activeIndex,
    isNavigating,
    navigationTarget,
    isReturning,
    registerNavigationHandler,
    handleQuestionSelect,
    zoom,
    canZoomIn,
    canZoomOut,
    registerZoomHandler,
    handleZoomIn,
    handleZoomOut,
  ])

  return (
    <AudioNavigationContext.Provider value={value}>
      {children}
    </AudioNavigationContext.Provider>
  )
}

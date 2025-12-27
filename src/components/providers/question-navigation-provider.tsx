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
  useQuestionNavigationList,
  type QuestionNavigationItem,
} from '@/lib/hooks/use-question-navigation-list'

// Zoom constants
const MAX_ZOOM = 1
const MIN_ZOOM = 0.5
const ZOOM_STEP = 0.1

type NavigationHandler = (item: QuestionNavigationItem) => void | Promise<void>
type ZoomHandler = () => void

interface NavigationTarget {
  id: string
  title: string
}

interface QuestionNavigationContextValue {
  // Navigation items from the query
  items: QuestionNavigationItem[]
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

  // Handler registration (called by FilteredQuestionsView)
  registerNavigationHandler: (handler: NavigationHandler) => void

  // Handler for sidebar panel to call
  handleQuestionSelect: (item: QuestionNavigationItem) => void | Promise<void>

  // Zoom state
  zoom: number
  canZoomIn: boolean
  canZoomOut: boolean

  // Zoom handler registration (called by FilteredQuestionsView for anchor preservation)
  registerZoomHandler: (handler: ZoomHandler) => void

  // Zoom handlers for sidebar to call
  handleZoomIn: () => void
  handleZoomOut: () => void
}

const QuestionNavigationContext = createContext<QuestionNavigationContextValue | null>(null)

export function useQuestionNavigation() {
  const context = useContext(QuestionNavigationContext)
  if (!context) {
    throw new Error('useQuestionNavigation must be used within QuestionNavigationProvider')
  }
  return context
}

interface QuestionNavigationProviderProps {
  children: ReactNode
}

export function QuestionNavigationProvider({ children }: QuestionNavigationProviderProps) {
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
  } = useQuestionNavigationList(filters)

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

  const handleQuestionSelect = useCallback((item: QuestionNavigationItem) => {
    if (navigationHandlerRef.current) {
      return navigationHandlerRef.current(item)
    }
    // Fallback: just set the active question (won't scroll)
    setActiveQuestionId(item.id)
  }, [])

  // Zoom handler registration ref (for anchor preservation in FilteredQuestionsView)
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

  const value = useMemo<QuestionNavigationContextValue>(() => ({
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
    <QuestionNavigationContext.Provider value={value}>
      {children}
    </QuestionNavigationContext.Provider>
  )
}

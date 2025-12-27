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

type NavigationHandler = (item: QuestionNavigationItem) => void | Promise<void>

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

  // Handler registration (called by FilteredQuestionsView)
  registerNavigationHandler: (handler: NavigationHandler) => void

  // Handler for sidebar panel to call
  handleQuestionSelect: (item: QuestionNavigationItem) => void | Promise<void>
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

  // Compute active index from activeQuestionId
  const activeIndex = useMemo(() => {
    if (!activeQuestionId) return null
    return idToIndex.get(activeQuestionId) ?? null
  }, [activeQuestionId, idToIndex])

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
    registerNavigationHandler,
    handleQuestionSelect,
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
    registerNavigationHandler,
    handleQuestionSelect,
  ])

  return (
    <QuestionNavigationContext.Provider value={value}>
      {children}
    </QuestionNavigationContext.Provider>
  )
}

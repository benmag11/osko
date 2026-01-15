'use client'

import { Loader2 } from 'lucide-react'
import type { NavigationState } from './types'

interface JumpPanelStatusProps {
  /** Navigation state from the navigation provider */
  navigation: NavigationState
}

/**
 * Status indicator for the jump panel
 * Shows current state: navigating, returning, updating, or total count
 *
 * This component is extracted to isolate re-renders from navigation context changes
 */
export function JumpPanelStatus({ navigation }: JumpPanelStatusProps) {
  const {
    totalCount,
    isLoading,
    isFetching,
    isNavigating,
    isReturning,
    navigationTarget,
    items,
  } = navigation

  const formattedCount = totalCount > 0 ? totalCount.toLocaleString() : null
  const showLoadingState = isLoading && items.length === 0

  const truncateTitle = (title: string, maxLength = 20) => {
    if (title.length <= maxLength) return title
    return title.slice(0, maxLength) + '…'
  }

  // "Jumping to [title]" state
  if (isNavigating && navigationTarget) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-salmon-500 min-w-0">
        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
        <span className="truncate">Jumping to {truncateTitle(navigationTarget.title)}</span>
      </span>
    )
  }

  // "Returning to position" state
  if (isReturning) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-salmon-500 min-w-0">
        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
        <span className="truncate">Returning to position</span>
      </span>
    )
  }

  // "Updating..." state (fetching in background)
  if (isFetching && !showLoadingState) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-stone-400 min-w-0">
        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
        Updating...
      </span>
    )
  }

  // Default: "[count] total questions"
  if (formattedCount) {
    return <span className="text-xs text-salmon-500">{formattedCount} total questions</span>
  }

  // Empty/loading state
  return <span className="text-xs text-stone-400">No questions</span>
}

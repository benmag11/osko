import { useEffect, useCallback } from 'react'

interface UseZoomKeyboardShortcutsOptions {
  onZoomIn: () => void
  onZoomOut: () => void
  canZoomIn: boolean
  canZoomOut: boolean
  enabled?: boolean
}

/**
 * Hook for handling keyboard shortcuts for zoom functionality
 *
 * Keys:
 * - '+' or '=' : Zoom in
 * - '-' : Zoom out
 *
 * Shortcuts are disabled when:
 * - User is typing in input fields (input, textarea, select, contentEditable)
 * - Modifier keys are pressed (Ctrl/Cmd/Alt) to preserve browser zoom
 */
export function useZoomKeyboardShortcuts({
  onZoomIn,
  onZoomOut,
  canZoomIn,
  canZoomOut,
  enabled = true,
}: UseZoomKeyboardShortcutsOptions): void {
  const isEditableElement = useCallback((element: Element | null): boolean => {
    if (!element) return false

    const tagName = element.tagName.toLowerCase()
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return true
    }

    if (element.getAttribute('contenteditable') === 'true') {
      return true
    }

    // Handle Radix UI components with textbox role
    if (element.getAttribute('role') === 'textbox') {
      return true
    }

    return false
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      if (isEditableElement(document.activeElement)) {
        return
      }

      // Skip if modifier keys are pressed (allow browser zoom with Ctrl/Cmd)
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      switch (event.key) {
        case '+':
        case '=':
          if (canZoomIn) {
            event.preventDefault()
            onZoomIn()
          }
          break
        case '-':
          if (canZoomOut) {
            event.preventDefault()
            onZoomOut()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, canZoomIn, canZoomOut, onZoomIn, onZoomOut, isEditableElement])
}

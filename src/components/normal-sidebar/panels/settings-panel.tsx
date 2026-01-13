'use client'

import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuestionNavigation } from '@/components/providers/question-navigation-provider'

export function SettingsPanel() {
  const { canZoomIn, canZoomOut, handleZoomIn, handleZoomOut } = useQuestionNavigation()

  return (
    <div className="flex flex-col gap-4">
      {/* Zoom control row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-stone-600">Zoom</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Zoom out"
            onClick={handleZoomOut}
            disabled={!canZoomOut}
            className="h-8 w-8 border-stone-200 hover:border-salmon-400 hover:text-salmon-500 hover:bg-salmon-50 disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Zoom in"
            onClick={handleZoomIn}
            disabled={!canZoomIn}
            className="h-8 w-8 border-stone-200 hover:border-salmon-400 hover:text-salmon-500 hover:bg-salmon-50 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

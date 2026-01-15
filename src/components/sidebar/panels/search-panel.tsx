'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useFilters } from '@/components/providers/filter-provider'

/**
 * Search panel for keyword filtering
 * Used by both normal and audio sidebars
 */
export function SearchPanel() {
  const { addSearchTerm } = useFilters()
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input when panel mounts
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleAddKeyword = () => {
    if (value.trim()) {
      addSearchTerm(value.trim())
      setValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddKeyword()
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Try typing 'prove'"
        className="h-9 text-sm flex-1 border-stone-200 focus-visible:ring-salmon-500/20"
      />
      <button
        type="button"
        onClick={handleAddKeyword}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-400 transition-all duration-150 hover:border-salmon-400 hover:text-salmon-500 hover:bg-salmon-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salmon-500/20"
        aria-label="Add search keyword"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useFilters } from '@/components/providers/filter-provider'

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
        className="h-8 text-sm flex-1"
      />
      <button
        type="button"
        onClick={handleAddKeyword}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-stone-300 bg-transparent transition-colors hover:border-salmon-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-salmon-500/30"
        aria-label="Add search keyword"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

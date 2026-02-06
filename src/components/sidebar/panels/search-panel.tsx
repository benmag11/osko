'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Input } from '@/components/ui/input'
import { FilterTag } from '@/components/filters/filter-tag'
import { useFilters } from '@/components/providers/filter-provider'

/**
 * Search panel for keyword filtering
 * Used by both normal and audio sidebars
 */
export function SearchPanel() {
  const { filters, addSearchTerm, removeSearchTerm } = useFilters()
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
    <div className="flex flex-col gap-2">
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
      <AnimatePresence initial={false}>
        {(filters.searchTerms?.length ?? 0) > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-1.5 overflow-hidden"
          >
            <p className="text-xs text-stone-400">
              Including questions containing:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {filters.searchTerms?.map((term) => (
                <motion.div
                  key={term}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  layout
                >
                  <FilterTag
                    label={term}
                    onRemove={() => removeSearchTerm(term)}
                    size="sm"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

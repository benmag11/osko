'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateUserName } from '../actions'
import { Check, X } from 'lucide-react'
import { useUserProfile } from '@/lib/hooks/use-user-profile'

interface NameSectionProps {
  initialName: string
}

export function NameSection({ initialName }: NameSectionProps) {
  const [name, setName] = useState(initialName)
  const [isFocused, setIsFocused] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const originalName = useRef(initialName)
  
  const { refetchProfile } = useUserProfile()

  // Check if the current value is different from the original
  const isDirty = name !== originalName.current
  const showActions = (isFocused || isDirty) && !isSaving

  const handleSave = useCallback(async () => {
    if (!isDirty) {
      setIsFocused(false)
      return
    }

    setIsSaving(true)
    setError(null)

    const result = await updateUserName(name)
    
    if (result.error) {
      setError(result.error)
      setIsSaving(false)
    } else {
      originalName.current = name
      await refetchProfile()
      setIsFocused(false)
      setIsSaving(false)
      // Remove focus from input after successful save
      inputRef.current?.blur()
    }
  }, [name, isDirty, refetchProfile])

  const handleCancel = useCallback(() => {
    setName(originalName.current)
    setError(null)
    setIsFocused(false)
    // Remove focus from input
    inputRef.current?.blur()
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (isDirty) {
        handleSave()
      }
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }, [isDirty, handleSave, handleCancel])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Don't hide actions if clicking on the action buttons
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget?.closest('[data-action-button]')) {
      return
    }
    
    // Only hide actions if not dirty
    if (!isDirty) {
      setIsFocused(false)
    }
  }, [isDirty])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    setError(null)
  }, [])

  return (
    <div className="px-6 py-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-serif font-medium text-warm-text-primary mb-2">
            Name
          </h3>
          
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Input
                ref={inputRef}
                type="text"
                value={name}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                placeholder="Enter your name"
                className={`
                  transition-all duration-200
                  ${isFocused ? 'border-salmon-500' : ''}
                  ${isDirty && !isFocused ? 'border-stone-400' : ''}
                `}
                aria-label="Name"
                aria-invalid={!!error}
                aria-describedby={error ? 'name-error' : undefined}
              />
            </div>
            
            {/* Action buttons with smooth transition */}
            <div 
              className={`
                flex gap-2 transition-all duration-200 ease-in-out
                ${showActions ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'}
              `}
              data-action-button
            >
              <Button
                onClick={handleSave}
                disabled={isSaving || !name.trim() || !isDirty}
                size="sm"
                className="h-8 transition-all duration-150 hover:scale-105"
                aria-label="Save name"
                tabIndex={showActions ? 0 : -1}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleCancel}
                disabled={isSaving}
                variant="outline"
                size="sm"
                className="h-8 transition-all duration-150 hover:scale-105"
                aria-label="Cancel editing"
                tabIndex={showActions ? 0 : -1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {error && (
            <p id="name-error" role="alert" className="mt-2 text-sm text-salmon-600 font-sans animate-in fade-in duration-200">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

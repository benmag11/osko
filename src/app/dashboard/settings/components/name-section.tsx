'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateUserName } from '../actions'
import { Check, X } from 'lucide-react'

interface NameSectionProps {
  initialName: string
}

export function NameSection({ initialName }: NameSectionProps) {
  const [name, setName] = useState(initialName)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const originalName = useRef(initialName)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (name === originalName.current) {
      setIsEditing(false)
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
      setIsEditing(false)
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setName(originalName.current)
    setIsEditing(false)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div className="px-6 py-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-serif font-medium text-warm-text-primary mb-2">
            Name
          </h3>
          
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSaving}
                  className="max-w-sm"
                  aria-label="Name"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !name.trim()}
                    size="sm"
                    className="h-8"
                    aria-label="Save name"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={isSaving}
                    variant="outline"
                    size="sm"
                    className="h-8"
                    aria-label="Cancel editing"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-warm-text-secondary hover:text-warm-text-primary transition-colors text-left font-sans text-sm"
              >
                {name || 'Click to add your name'}
              </button>
            )}
          </div>
          
          {error && (
            <p className="mt-2 text-sm text-salmon-600 font-sans">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { submitContactForm } from '@/app/contact/actions'
import { CheckCircle2 } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

const MIN_LENGTH = 10
const MAX_LENGTH = 2000

export function FeatureRequestSection() {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [serverError, setServerError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const charCount = message.length
  const isOverLimit = charCount > MAX_LENGTH

  function validate(): boolean {
    const trimmed = message.trim()
    if (!trimmed) {
      setValidationError('Please describe your feature idea.')
      return false
    }
    if (trimmed.length < MIN_LENGTH) {
      setValidationError(`Message must be at least ${MIN_LENGTH} characters.`)
      return false
    }
    if (trimmed.length > MAX_LENGTH) {
      setValidationError(`Message must be less than ${MAX_LENGTH} characters.`)
      return false
    }
    return true
  }

  async function handleSubmit() {
    setValidationError(null)
    setServerError(null)

    if (!validate()) return

    setStatus('loading')
    const result = await submitContactForm({
      category: 'Feature Request',
      message: message.trim(),
    })

    if (result.error) {
      setServerError(result.error)
      setStatus('error')
    } else {
      setStatus('success')
    }
  }

  function handleReset() {
    setMessage('')
    setStatus('idle')
    setServerError(null)
    setValidationError(null)
  }

  const errorMessage = validationError || serverError
  const errorId = 'feature-request-error'

  if (status === 'success') {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">Thanks for your suggestion!</p>
        </div>
        <button
          onClick={handleReset}
          className="mt-2 text-sm font-medium text-salmon-500 hover:text-salmon-600 transition-colors"
        >
          Submit another idea
        </button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <p className="text-sm text-warm-text-muted mb-3">
        Got an idea for a feature or improvement? Let me know.
      </p>

      <textarea
        rows={4}
        placeholder="Describe your idea..."
        value={message}
        onChange={(e) => {
          setMessage(e.target.value)
          if (validationError) setValidationError(null)
          if (serverError) setServerError(null)
        }}
        disabled={status === 'loading'}
        aria-label="Feature request"
        aria-invalid={!!errorMessage}
        aria-describedby={errorMessage ? errorId : undefined}
        className="flex w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-warm-text-secondary placeholder:text-warm-text-subtle focus-visible:border-salmon-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
      />

      <div className="flex justify-between mt-1.5">
        <div>
          {errorMessage && (
            <p
              id={errorId}
              role="alert"
              className="text-sm text-salmon-600"
            >
              {errorMessage}
            </p>
          )}
        </div>
        <span
          className={`text-xs tabular-nums ${
            isOverLimit ? 'text-salmon-600' : 'text-warm-text-subtle'
          }`}
        >
          {charCount}/{MAX_LENGTH}
        </span>
      </div>

      <div className="mt-3">
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={status === 'loading' || !message.trim()}
        >
          {status === 'loading' ? 'Sending...' : 'Submit'}
        </Button>
      </div>
    </div>
  )
}

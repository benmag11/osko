'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { submitContactForm } from './actions'

const CATEGORIES = [
  'General Question',
  'Bug Report',
  'Billing Issue',
  'Feature Request',
  'Other',
] as const

interface ContactClientProps {
  userName?: string
  userEmail?: string
}

interface FieldErrors {
  name?: string
  email?: string
  category?: string
  message?: string
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

export function ContactClient({ userName, userEmail }: ContactClientProps) {
  const isLoggedIn = !!userEmail
  const [name, setName] = useState(userName ?? '')
  const [email, setEmail] = useState(userEmail ?? '')
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [replyEmail, setReplyEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')

  function validateFields(): boolean {
    const errors: FieldErrors = {}

    if (!isLoggedIn) {
      if (!name.trim()) {
        errors.name = 'Name is required'
      } else if (name.trim().length > 100) {
        errors.name = 'Name must be less than 100 characters'
      }
    }

    if (!isLoggedIn) {
      if (!email.trim()) {
        errors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = 'Please enter a valid email address'
      }
    }

    if (!category) {
      errors.category = 'Please select a category'
    }

    if (!message.trim()) {
      errors.message = 'Message is required'
    } else if (message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters'
    } else if (message.trim().length > 2000) {
      errors.message = 'Message must be less than 2000 characters'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')

    if (!validateFields()) return

    setStatus('loading')

    const result = await submitContactForm({
      ...(isLoggedIn ? {} : { name: name.trim(), email: email.trim() }),
      category,
      message: message.trim(),
    })

    if (result.error) {
      setServerError(result.error)
      setStatus('error')
      return
    }

    setStatus('success')
    setReplyEmail(isLoggedIn ? userEmail! : email.trim())
    setName(userName ?? '')
    setEmail(userEmail ?? '')
    setCategory('')
    setMessage('')
    setFieldErrors({})
  }

  if (status === 'success') {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="w-12 h-12 text-[#ED805E] mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="font-display text-2xl font-medium text-[#1C1917] mb-2">
          Thanks for reaching out!
        </h2>
        <p className="text-[#57534E] mb-8">
          I read every email and will reply as soon as possible to{' '}
          <span className="font-medium text-[#1C1917]">{replyEmail}</span>.
        </p>
        <Button
          variant="outline"
          onClick={() => setStatus('idle')}
        >
          Send another message
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg mx-auto">
      {/* Name — only shown for logged-out users */}
      {!isLoggedIn && (
        <div>
          <label
            htmlFor="contact-name"
            className="block text-sm font-medium text-[#1C1917] mb-1.5"
          >
            Name
          </label>
          <Input
            id="contact-name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }))
            }}
            aria-invalid={!!fieldErrors.name}
          />
          {fieldErrors.name && (
            <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>
          )}
        </div>
      )}

      {/* Email — only shown for logged-out users */}
      {!isLoggedIn && (
        <div>
          <label
            htmlFor="contact-email"
            className="block text-sm font-medium text-[#1C1917] mb-1.5"
          >
            Your Email
          </label>
          <Input
            id="contact-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }))
            }}
            aria-invalid={!!fieldErrors.email}
          />
          {fieldErrors.email && (
            <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>
          )}
        </div>
      )}

      {/* Category */}
      <div>
        <label
          htmlFor="contact-category"
          className="block text-sm font-medium text-[#1C1917] mb-1.5"
        >
          Category
        </label>
        <Select
          value={category}
          onValueChange={(val) => {
            setCategory(val)
            if (fieldErrors.category) setFieldErrors((prev) => ({ ...prev, category: undefined }))
          }}
        >
          <SelectTrigger className="w-full" aria-invalid={!!fieldErrors.category}>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.category && (
          <p className="text-sm text-red-600 mt-1">{fieldErrors.category}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-[#1C1917] mb-1.5"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          rows={6}
          placeholder="How can we help?"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            if (fieldErrors.message) setFieldErrors((prev) => ({ ...prev, message: undefined }))
          }}
          aria-invalid={!!fieldErrors.message}
          className="flex w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-warm-text-secondary placeholder:text-warm-text-subtle focus-visible:border-salmon-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
        />
        <div className="flex justify-between mt-1">
          {fieldErrors.message ? (
            <p className="text-sm text-red-600">{fieldErrors.message}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-[#57534E]">
            {message.length}/2000
          </p>
        </div>
      </div>

      {/* Server error */}
      {serverError && (
        <p className="text-sm text-red-600 text-center">{serverError}</p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={status === 'loading'}
        className="w-full"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Message'
        )}
      </Button>
    </form>
  )
}

'use client'

import { X } from 'lucide-react'
import { toast } from 'sonner'

interface CustomToastProps {
  id: string | number
  variant: 'success' | 'error'
  title: string
  description?: string | string[]
}

export function CustomToast({ id, variant, title, description }: CustomToastProps) {
  const isError = variant === 'error'

  const accentGradient = isError
    ? 'from-red-400 to-red-500'
    : 'from-salmon-400 to-coral-400'

  const borderColor = isError ? 'border-red-300' : 'border-salmon-400'

  const descriptionLines = description
    ? Array.isArray(description)
      ? description
      : [description]
    : []

  return (
    <div
      className={`w-[380px] max-w-[calc(100vw-2rem)] rounded-lg border ${borderColor} bg-white shadow-lg overflow-hidden`}
    >
      {/* Top accent gradient bar */}
      <div className={`h-[3px] bg-gradient-to-r ${accentGradient}`} />

      <div className="relative px-5 pt-4 pb-4">
        <button
          onClick={() => toast.dismiss(id)}
          className="absolute top-3.5 right-3.5 p-0.5 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="font-display font-semibold text-xl text-center text-warm-text-primary tracking-tight leading-snug pr-6">
          {title}
        </p>
        {descriptionLines.length > 0 && (
          <div className="mt-2 space-y-0.5 text-center">
            {descriptionLines.map((line, i) => (
              <p
                key={i}
                className="text-[13px] text-warm-text-secondary leading-snug"
              >
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

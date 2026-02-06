'use client'

import { useState, useCallback } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Maximize2, X } from 'lucide-react'
import { getTransformedImageUrl } from '@/lib/supabase/image-loader'

interface ImageLightboxProps {
  src: string
  alt: string
  naturalWidth: number
}

export function ImageLightbox({ src, alt, naturalWidth }: ImageLightboxProps) {
  const [open, setOpen] = useState(false)
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null)

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && !fullscreenUrl) {
        // Compute fullscreen URL lazily on first open
        const dpr =
          typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
        const viewportWidth =
          typeof window !== 'undefined' ? window.innerWidth : 1920
        const targetWidth = Math.min(
          naturalWidth,
          Math.round(viewportWidth * Math.min(dpr, 2))
        )
        setFullscreenUrl(getTransformedImageUrl(src, targetWidth, 85))
      }
      setOpen(nextOpen)
    },
    [fullscreenUrl, naturalWidth, src]
  )

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className="absolute top-2 right-2 z-10 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-md text-stone-400 opacity-0 transition-opacity hover:text-stone-600 focus:opacity-100 group-hover:opacity-100 lg:flex"
          aria-label={`View ${alt} fullscreen`}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:p-8"
          aria-label={alt}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleOpenChange(false)
          }}
        >
          {/* Hidden title for a11y — Radix warns without it */}
          <DialogPrimitive.Title className="sr-only">
            {alt}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Fullscreen view of {alt}
          </DialogPrimitive.Description>

          {fullscreenUrl && (
            <img
              src={fullscreenUrl}
              alt={alt}
              className="max-h-full max-w-full object-contain"
            />
          )}

          <DialogPrimitive.Close asChild>
            <button
              type="button"
              className="absolute top-4 right-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white/90 transition-colors hover:bg-black/80"
              aria-label="Close fullscreen view"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

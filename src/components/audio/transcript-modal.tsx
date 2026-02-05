'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { TranscriptContent } from './transcript-content'
import { AlertCircle, X } from 'lucide-react'
import { formatQuestionTitle } from '@/lib/utils/question-format'
import type { AudioQuestion, TranscriptItem } from '@/lib/types/database'

interface TranscriptModalProps {
  question: AudioQuestion
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Elegant Reader - Audio transcript modal with book-like reading experience
 *
 * Features:
 * - Beautiful serif typography
 * - Focus mode during playback
 * - Bottom-anchored controls (Kindle-style)
 */
export function TranscriptModal({
  question,
  open,
  onOpenChange,
}: TranscriptModalProps) {
  const [transcript, setTranscript] = useState<TranscriptItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch transcript when modal opens
  useEffect(() => {
    if (!open || !question.map_json_url) {
      return
    }

    setIsLoading(true)
    setError(null)

    fetch(question.map_json_url)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load transcript')
        }
        return response.json()
      })
      .then((data: TranscriptItem[]) => {
        setTranscript(data)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Error loading transcript:', err)
        setError('Failed to load transcript. Please try again.')
        setIsLoading(false)
      })
  }, [open, question.map_json_url])

  const title = formatQuestionTitle(question)

  const handleRetry = () => {
    setIsLoading(true)
    setError(null)
    if (question.map_json_url) {
      fetch(question.map_json_url)
        .then((r) => r.json())
        .then(setTranscript)
        .catch(() => setError('Failed to load transcript'))
        .finally(() => setIsLoading(false))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl w-[98vw] h-[98vh] sm:w-[95vw] sm:h-[95vh] flex flex-col p-0 gap-0 bg-stone-100 border-none shadow-2xl overflow-hidden"
        showCloseButton={false}
      >
        {/* Minimal header with gradient fade */}
        <div className="absolute top-0 inset-x-0 z-20 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-stone-100 via-stone-100/90 to-transparent pointer-events-none">
          <DialogTitle className="text-xs font-sans font-normal uppercase tracking-[0.15em] text-stone-500 pointer-events-auto">
            {title}
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 -m-2 text-stone-400 hover:text-stone-600 transition-colors pointer-events-auto rounded-full hover:bg-salmon-50"
            aria-label="Close transcript"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="h-full" />
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
              <div className="w-14 h-14 rounded-full bg-salmon-50 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-salmon-600" />
              </div>
              <p className="font-serif text-stone-600">{error}</p>
              <button
                onClick={handleRetry}
                className="text-sm font-sans text-salmon-500 hover:text-salmon-600 underline underline-offset-4 transition-colors"
              >
                Try again
              </button>
            </div>
          ) : transcript && question.audio_url ? (
            <div className="h-full">
              <TranscriptContent
                audioUrl={question.audio_url}
                transcript={transcript}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="font-serif italic text-stone-500">No transcript available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

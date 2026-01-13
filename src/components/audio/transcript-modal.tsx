'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TranscriptContent } from './transcript-content'
import { Loader2 } from 'lucide-react'
import { formatQuestionTitle } from '@/lib/utils/question-format'
import type { AudioQuestion, TranscriptItem, Question } from '@/lib/types/database'

interface TranscriptModalProps {
  question: AudioQuestion
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Modal for displaying audio transcript with synchronized playback
 *
 * Features:
 * - Fetches transcript JSON from map_json_url
 * - Shows loading state while fetching
 * - Contains audio player and synchronized transcript
 * - Full-height modal for comfortable reading
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

  const title = formatQuestionTitle(question as unknown as Question)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-4xl w-[95vw] h-[95vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 shrink-0">
          <DialogTitle className="font-serif text-lg">
            Transcript: {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-salmon-500" />
                <p className="text-sm text-stone-500">Loading transcript...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3 text-center px-6">
                <p className="text-salmon-600">{error}</p>
                <button
                  onClick={() => {
                    // Re-trigger fetch
                    setIsLoading(true)
                    setError(null)
                    if (question.map_json_url) {
                      fetch(question.map_json_url)
                        .then((r) => r.json())
                        .then(setTranscript)
                        .catch(() => setError('Failed to load transcript'))
                        .finally(() => setIsLoading(false))
                    }
                  }}
                  className="text-sm text-salmon-500 hover:text-salmon-600 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : transcript && question.audio_url ? (
            <TranscriptContent
              audioUrl={question.audio_url}
              transcript={transcript}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-stone-500">No transcript available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

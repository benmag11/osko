'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useTranscriptSync } from '@/lib/hooks/use-transcript-sync'
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import type { TranscriptItem } from '@/lib/types/database'

interface TranscriptContentProps {
  audioUrl: string
  transcript: TranscriptItem[]
}

/**
 * Format seconds into MM:SS format
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Audio player with synchronized transcript display
 *
 * Features:
 * - Play/pause controls with progress bar
 * - Skip forward/backward buttons
 * - Real-time word highlighting as audio plays
 * - Click on any word to seek to that position
 * - Visual separation between transcript sections
 */
export function TranscriptContent({ audioUrl, transcript }: TranscriptContentProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const activeWordRef = useRef<HTMLSpanElement>(null)

  const {
    activeWordIndex,
    activeSentenceIndex,
    activeWordIndexInSentence,
    currentTime,
    isPlaying,
    duration,
    seekTo,
    togglePlayPause,
  } = useTranscriptSync(transcript, audioRef)

  // Auto-scroll to keep active word visible
  useEffect(() => {
    if (activeWordRef.current) {
      activeWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [activeWordIndex])

  const handleSkipBackward = () => {
    seekTo(Math.max(0, currentTime - 5))
  }

  const handleSkipForward = () => {
    seekTo(Math.min(duration, currentTime + 5))
  }

  const handleSliderChange = (value: number[]) => {
    seekTo(value[0])
  }

  // Track sentence index for rendering
  let sentenceCounter = 0

  return (
    <div className="flex flex-col h-full">
      {/* Audio element (hidden) */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Audio controls */}
      <div className="flex flex-col gap-3 p-4 border-b border-stone-200 bg-stone-50 shrink-0">
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-500 tabular-nums w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSliderChange}
            className="flex-1"
          />
          <span className="text-xs text-stone-500 tabular-nums w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkipBackward}
            className="h-9 w-9 text-stone-600 hover:text-stone-900"
            title="Skip backward 5 seconds"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={togglePlayPause}
            className="h-12 w-12 rounded-full bg-salmon-500 hover:bg-salmon-600 text-white"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkipForward}
            className="h-9 w-9 text-stone-600 hover:text-stone-900"
            title="Skip forward 5 seconds"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Transcript display */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {transcript.map((item, itemIndex) => {
          if (item.type === 'header') {
            return (
              <h3
                key={`header-${itemIndex}`}
                className="text-lg font-semibold text-stone-800 border-b border-stone-200 pb-2"
              >
                {item.text}
              </h3>
            )
          }

          // Sentence type
          const currentSentenceIndex = sentenceCounter
          sentenceCounter++
          const isSentenceActive = activeSentenceIndex === currentSentenceIndex

          return (
            <div
              key={`sentence-${itemIndex}`}
              className={cn(
                'p-3 rounded-lg transition-colors duration-200',
                isSentenceActive ? 'bg-salmon-50' : 'bg-transparent'
              )}
            >
              {/* Irish text with word highlighting */}
              <p className="text-base leading-relaxed mb-2">
                {item.words.map((word, wordIndex) => {
                  const isWordActive =
                    isSentenceActive && activeWordIndexInSentence === wordIndex

                  return (
                    <span
                      key={`word-${itemIndex}-${wordIndex}`}
                      ref={isWordActive ? activeWordRef : null}
                      onClick={() => seekTo(word.start)}
                      className={cn(
                        'cursor-pointer transition-all duration-150 rounded px-0.5 -mx-0.5',
                        isWordActive
                          ? 'bg-salmon-400 text-white'
                          : 'hover:bg-salmon-100'
                      )}
                    >
                      {word.text}
                      {wordIndex < item.words.length - 1 ? ' ' : ''}
                    </span>
                  )
                })}
              </p>

              {/* Translation */}
              {item.translation && (
                <p className="text-sm text-stone-500 italic">
                  {item.translation}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

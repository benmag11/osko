'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useTranscriptSync } from '@/lib/hooks/use-transcript-sync'
import { Languages, Play, Pause, RotateCcw, RotateCw } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { AudioSpeedControls } from './audio-speed-controls'
import { AudioVerticalVolumeControl } from './audio-vertical-volume-control'
import type { TranscriptItem, TranscriptSentence } from '@/lib/types/database'

interface TranscriptContentProps {
  audioUrl: string
  transcript: TranscriptItem[]
}

/**
 * Represents a paragraph group for paragraph mode (translations hidden)
 * Groups consecutive sentences by the same speaker into paragraphs
 */
interface ParagraphGroup {
  type: 'paragraph'
  speaker?: string
  sentences: Array<{
    item: TranscriptSentence
    sentenceIndex: number
  }>
}

type GroupedItem = ParagraphGroup | { type: 'header'; text: string }

/**
 * Groups sentences by speaker for paragraph mode display
 * Consecutive sentences by the same speaker form one paragraph
 */
function groupSentencesIntoParagraphs(transcript: TranscriptItem[]): GroupedItem[] {
  const result: GroupedItem[] = []
  let currentGroup: ParagraphGroup | null = null
  let sentenceIndex = 0

  for (const item of transcript) {
    if (item.type === 'header') {
      // Flush current group before header
      if (currentGroup && currentGroup.sentences.length > 0) {
        result.push(currentGroup)
        currentGroup = null
      }
      result.push({ type: 'header', text: item.text })
    } else {
      // Check if we need to start a new paragraph group
      const shouldStartNewGroup =
        !currentGroup ||
        (item.speaker && item.speaker !== currentGroup.speaker) ||
        (!item.speaker && currentGroup.speaker)

      if (shouldStartNewGroup) {
        if (currentGroup && currentGroup.sentences.length > 0) {
          result.push(currentGroup)
        }
        currentGroup = {
          type: 'paragraph',
          speaker: item.speaker,
          sentences: [],
        }
      }

      currentGroup!.sentences.push({
        item,
        sentenceIndex,
      })
      sentenceIndex++
    }
  }

  // Flush final group
  if (currentGroup && currentGroup.sentences.length > 0) {
    result.push(currentGroup)
  }

  return result
}

/**
 * Determines opacity based on focus mode (during playback)
 * Active sentence is fully visible, others are dimmed
 */
function getSentenceOpacity(
  sentenceIndex: number,
  activeSentenceIndex: number | null,
  isPlaying: boolean
): number {
  if (!isPlaying || activeSentenceIndex === null) return 1
  if (sentenceIndex === activeSentenceIndex) return 1
  if (sentenceIndex < activeSentenceIndex) return 0.5
  return 0.35
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Elegant Reader - Premium audio transcript with book-like reading experience
 *
 * Features:
 * - Beautiful serif typography for Irish text
 * - Focus mode that dims inactive sentences during playback
 * - Bottom-anchored controls (Kindle-style)
 * - Smooth Motion animations
 */
export function TranscriptContent({ audioUrl, transcript }: TranscriptContentProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const activeSentenceRef = useRef<HTMLDivElement>(null)
  const [showTranslations, setShowTranslations] = useState(true)

  const {
    activeSentenceIndex,
    activeWordIndexInSentence,
    currentTime,
    isPlaying,
    duration,
    playbackRate,
    volume,
    isMuted,
    isLoading,
    seekTo,
    togglePlayPause,
    skip,
    setPlaybackRate,
    setVolume,
    toggleMute,
  } = useTranscriptSync(transcript, audioRef)

  // Memoize grouped paragraphs for paragraph mode
  const groupedItems = useMemo(
    () => groupSentencesIntoParagraphs(transcript),
    [transcript]
  )

  // Auto-scroll to keep active sentence visible (triggered on sentence change)
  useEffect(() => {
    if (activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [activeSentenceIndex])

  // Track sentence index for sentence view rendering
  let sentenceCounter = 0

  return (
    <div className="relative flex flex-col h-full bg-stone-100">
      {/* Audio element (hidden) */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Scrollable transcript area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pt-14 pb-28 px-4 sm:px-6"
      >
        <div className="max-w-2xl mx-auto">
          {showTranslations ? (
            // ========== SENTENCE VIEW (Translations ON) ==========
            <div className="space-y-1">
              {transcript.map((item, itemIndex) => {
                if (item.type === 'header') {
                  return (
                    <div key={`header-${itemIndex}`} className="flex items-center gap-4 my-10 first:mt-4">
                      <div className="flex-1 h-px bg-stone-300" />
                      <span className="text-[11px] font-sans font-semibold text-stone-400 uppercase tracking-widest">
                        {item.text}
                      </span>
                      <div className="flex-1 h-px bg-stone-300" />
                    </div>
                  )
                }

                // Sentence type
                const currentSentenceIndex = sentenceCounter
                sentenceCounter++
                const isSentenceActive = activeSentenceIndex === currentSentenceIndex
                const opacity = getSentenceOpacity(currentSentenceIndex, activeSentenceIndex, isPlaying)

                return (
                  <motion.div
                    key={`sentence-${itemIndex}`}
                    ref={isSentenceActive ? activeSentenceRef : null}
                    animate={{ opacity }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={cn(
                      'py-4 px-5 -mx-5 rounded-lg transition-colors duration-300',
                      isSentenceActive
                        ? 'bg-salmon-50/70'
                        : 'bg-transparent'
                    )}
                  >
                    {/* Speaker label */}
                    {item.speaker && (
                      <span className="font-serif text-sm italic text-salmon-600 mb-2 block">
                        {item.speaker}
                      </span>
                    )}

                    {/* Irish text with word-level interaction */}
                    <p className="font-serif text-lg sm:text-xl leading-[1.8] text-stone-800 tracking-[0.01em]">
                      {item.words.map((word, wordIndex) => {
                        const isWordActive =
                          isSentenceActive && activeWordIndexInSentence === wordIndex

                        return (
                          <span
                            key={`word-${itemIndex}-${wordIndex}`}
                            onClick={() => seekTo(word.start)}
                            className={cn(
                              'cursor-pointer transition-all duration-150 hover:text-salmon-600',
                              isWordActive && 'text-black'
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
                      <p className="mt-2 text-sm sm:text-base font-sans text-stone-500 italic leading-relaxed">
                        {item.translation}
                      </p>
                    )}
                  </motion.div>
                )
              })}
            </div>
          ) : (
            // ========== PARAGRAPH VIEW (Translations OFF) ==========
            <div className="space-y-6">
              {groupedItems.map((group, groupIndex) => {
                if (group.type === 'header') {
                  return (
                    <div key={`header-${groupIndex}`} className="flex items-center gap-4 my-10 first:mt-4">
                      <div className="flex-1 h-px bg-stone-300" />
                      <span className="text-[11px] font-sans font-semibold text-stone-400 uppercase tracking-widest">
                        {group.text}
                      </span>
                      <div className="flex-1 h-px bg-stone-300" />
                    </div>
                  )
                }

                // Paragraph group
                return (
                  <div key={`para-${groupIndex}`}>
                    {/* Speaker label for paragraph */}
                    {group.speaker && (
                      <span className="font-serif text-sm italic text-salmon-600 mb-2 block">
                        {group.speaker}
                      </span>
                    )}

                    {/* Flowing paragraph text */}
                    <p className="font-serif text-lg sm:text-xl leading-[1.8] text-stone-800 tracking-[0.01em]">
                      {group.sentences.map(({ item, sentenceIndex: sentIdx }, sentenceIdx) => {
                        const isSentenceActive = activeSentenceIndex === sentIdx
                        const opacity = getSentenceOpacity(sentIdx, activeSentenceIndex, isPlaying)

                        return (
                          <motion.span
                            key={`sent-${sentenceIdx}`}
                            ref={isSentenceActive ? activeSentenceRef : null}
                            animate={{ opacity }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className={cn(
                              'transition-colors duration-300 rounded-sm',
                              isSentenceActive && 'bg-salmon-50/60 px-1 -mx-1'
                            )}
                          >
                            {sentenceIdx > 0 ? ' ' : ''}
                            {item.words.map((word, wordIndex) => {
                              const isWordActive =
                                isSentenceActive && activeWordIndexInSentence === wordIndex

                              return (
                                <span
                                  key={`word-${wordIndex}`}
                                  onClick={() => seekTo(word.start)}
                                  className={cn(
                                    'cursor-pointer transition-all duration-150 hover:text-salmon-600',
                                    isWordActive && 'text-black'
                                  )}
                                >
                                  {word.text}
                                  {wordIndex < item.words.length - 1 ? ' ' : ''}
                                </span>
                              )
                            })}
                          </motion.span>
                        )
                      })}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls bar - frosted glass effect */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="absolute bottom-0 inset-x-0 bg-stone-100/95 backdrop-blur-sm border-t border-stone-200"
      >
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
          {/* Progress bar with time */}
          <div className="flex items-center gap-3">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.01}
              onValueChange={(value) => seekTo(value[0])}
              disabled={!duration}
              className="flex-1 [&_[data-slot=track]]:h-1 [&_[data-slot=track]]:bg-stone-200 [&_[data-slot=range]]:bg-salmon-500 [&_[data-slot=thumb]]:h-3 [&_[data-slot=thumb]]:w-3 [&_[data-slot=thumb]]:border-salmon-500 [&_[data-slot=thumb]]:bg-white"
              aria-label="Audio progress"
            />
            <span className="text-xs font-sans tabular-nums text-stone-500 shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            {/* Left: Translation toggle */}
            <button
              onClick={() => setShowTranslations(!showTranslations)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans transition-all duration-200',
                showTranslations
                  ? 'border border-salmon-400 bg-salmon-50 text-salmon-600'
                  : 'border border-stone-200 bg-transparent text-stone-400 hover:border-salmon-400 hover:text-salmon-600'
              )}
            >
              <Languages className="h-3.5 w-3.5" />
              <span>{showTranslations ? 'EN' : 'GA'}</span>
            </button>

            {/* Center: Playback controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => skip(-5)}
                aria-label="Skip backward 5 seconds"
                className="h-9 w-9 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-200 hover:text-stone-700 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className={cn(
                  'h-11 w-11 rounded-full flex items-center justify-center transition-all duration-200',
                  'bg-salmon-500 text-white shadow-md hover:bg-salmon-600 hover:shadow-lg',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salmon-500 focus-visible:ring-offset-2'
                )}
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </button>

              <button
                onClick={() => skip(5)}
                aria-label="Skip forward 5 seconds"
                className="h-9 w-9 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-200 hover:text-stone-700 transition-colors"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>

            {/* Right: Speed & Volume */}
            <div className="flex items-center gap-1">
              <AudioSpeedControls
                playbackRate={playbackRate}
                onPlaybackRateChange={setPlaybackRate}
              />

              <AudioVerticalVolumeControl
                volume={volume}
                isMuted={isMuted}
                onVolumeChange={setVolume}
                onToggleMute={toggleMute}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

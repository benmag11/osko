'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useTranscriptSync } from '@/lib/hooks/use-transcript-sync'
import { Languages } from 'lucide-react'
import { AudioPlayerControls } from './audio-player-controls'
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
 * Premium audio player with synchronized transcript display
 *
 * Features:
 * - Full-screen immersive reading experience
 * - Translation toggle (show/hide English translations)
 * - Sentence-level highlighting with subtle word emphasis
 * - Speaker labels for conversations
 * - Paragraph mode when translations hidden
 * - Click on any word/sentence to seek
 */
export function TranscriptContent({ audioUrl, transcript }: TranscriptContentProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const activeSentenceRef = useRef<HTMLDivElement>(null)
  const [showTranslations, setShowTranslations] = useState(true)

  const {
    activeSentenceIndex,
    activeWordIndexInSentence,
    currentTime,
    isPlaying,
    duration,
    volume,
    playbackRate,
    isMuted,
    isLoading,
    seekTo,
    togglePlayPause,
    skip,
    setVolume,
    setPlaybackRate,
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
    <div className="flex flex-col h-full bg-cream-50">
      {/* Audio element (hidden) */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Audio Player Controls - matching main screen player */}
      <div className="shrink-0 bg-gradient-to-b from-cream-100 to-cream-50 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <AudioPlayerControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          isLoading={isLoading}
          volume={volume}
          playbackRate={playbackRate}
          isMuted={isMuted}
          onTogglePlayPause={togglePlayPause}
          onSeek={seekTo}
          onSkip={skip}
          onVolumeChange={setVolume}
          onPlaybackRateChange={setPlaybackRate}
          onToggleMute={toggleMute}
        />
        </div>
      </div>

      {/* Translations toggle - below player */}
      <div className="shrink-0 px-4 py-2 border-b border-stone-200">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setShowTranslations(!showTranslations)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium',
              'border border-stone-300 bg-white text-stone-600 transition-all duration-200',
              'hover:bg-stone-50'
            )}
          >
            <Languages className="h-3.5 w-3.5" />
            <span>Translations</span>
            <span
              className={cn(
                'text-xs font-semibold',
                showTranslations ? 'text-salmon-600' : 'text-stone-400'
              )}
            >
              {showTranslations ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Transcript display area */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {showTranslations ? (
            // ========== SENTENCE VIEW (Translations ON) ==========
            <div className="space-y-4">
              {transcript.map((item, itemIndex) => {
                if (item.type === 'header') {
                  return (
                    <h3
                      key={`header-${itemIndex}`}
                      className="font-serif text-xl font-semibold text-stone-800 mt-8 first:mt-0"
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
                    ref={isSentenceActive ? activeSentenceRef : null}
                    className={cn(
                      'p-4 rounded-xl transition-all duration-300',
                      isSentenceActive
                        ? 'bg-salmon-50/70 shadow-sm ring-1 ring-salmon-200/50'
                        : 'bg-transparent hover:bg-stone-100/50'
                    )}
                  >
                    {/* Speaker label */}
                    {item.speaker && (
                      <span className="font-serif font-medium italic text-salmon-600 text-sm mb-2 block">
                        {item.speaker}:
                      </span>
                    )}

                    {/* Irish text with word-level interaction */}
                    <p className="font-serif text-lg leading-relaxed text-stone-600 mb-2">
                      {item.words.map((word, wordIndex) => {
                        const isWordActive =
                          isSentenceActive && activeWordIndexInSentence === wordIndex

                        return (
                          <span
                            key={`word-${itemIndex}-${wordIndex}`}
                            onClick={() => seekTo(word.start)}
                            className={cn(
                              'cursor-pointer transition-all duration-150 rounded px-0.5 -mx-0.5',
                              isWordActive
                                ? 'text-stone-900'
                                : 'hover:text-stone-800'
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
                      <p className="text-base text-stone-500 italic leading-relaxed">
                        {item.translation}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            // ========== PARAGRAPH VIEW (Translations OFF) ==========
            <div className="space-y-6">
              {groupedItems.map((group, groupIndex) => {
                if (group.type === 'header') {
                  return (
                    <h3
                      key={`header-${groupIndex}`}
                      className="font-serif text-xl font-semibold text-stone-800 mt-8 first:mt-0"
                    >
                      {group.text}
                    </h3>
                  )
                }

                // Paragraph group
                return (
                  <div key={`para-${groupIndex}`} className="mb-6">
                    {/* Speaker label for paragraph */}
                    {group.speaker && (
                      <span className="font-serif font-medium italic text-salmon-600 text-sm mb-2 block">
                        {group.speaker}:
                      </span>
                    )}

                    {/* Flowing paragraph text */}
                    <p className="font-serif text-lg leading-relaxed text-stone-600">
                      {group.sentences.map(({ item, sentenceIndex: sentIdx }, sentenceIdx) => {
                        const isSentenceActive = activeSentenceIndex === sentIdx

                        return (
                          <span
                            key={`sent-${sentenceIdx}`}
                            ref={isSentenceActive ? activeSentenceRef : null}
                            className={cn(
                              'transition-all duration-200 rounded-sm',
                              isSentenceActive
                                ? 'bg-stone-200/50 px-1 -mx-1'
                                : ''
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
                                    'cursor-pointer transition-all duration-150',
                                    isWordActive
                                      ? 'text-stone-900'
                                      : 'hover:text-stone-800'
                                  )}
                                >
                                  {word.text}
                                  {wordIndex < item.words.length - 1 ? ' ' : ''}
                                </span>
                              )
                            })}
                          </span>
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
    </div>
  )
}

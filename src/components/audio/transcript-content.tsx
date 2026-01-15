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
    <div className="flex flex-col h-full bg-stone-100">
      {/* Audio element (hidden) */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Audio Player Controls - matching main screen player */}
      <div className="shrink-0 bg-gradient-to-b from-white to-stone-100 px-4 py-3 border-b border-stone-200">
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
      <div className="shrink-0 px-4 py-2.5 bg-white border-b border-stone-200">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setShowTranslations(!showTranslations)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-sans',
              'text-stone-500 transition-all duration-200',
              'hover:bg-stone-50 hover:text-stone-600'
            )}
          >
            <Languages className="h-3.5 w-3.5" />
            <span>Translations</span>
            <span
              className={cn(
                'font-medium',
                showTranslations ? 'text-stone-700' : 'text-stone-400'
              )}
            >
              {showTranslations ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Transcript display area */}
      <div className="flex-1 overflow-y-auto bg-stone-100 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] px-6 sm:px-8 py-6">
          {showTranslations ? (
            // ========== SENTENCE VIEW (Translations ON) ==========
            <div className="space-y-3">
              {transcript.map((item, itemIndex) => {
                if (item.type === 'header') {
                  return (
                    <p key={`header-${itemIndex}`} className="mt-8 first:mt-0 mb-3 text-[11px] font-sans font-semibold text-stone-400 uppercase tracking-widest">
                      {item.text}
                    </p>
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
                      'p-3 rounded-lg transition-all duration-200',
                      isSentenceActive
                        ? 'bg-salmon-50/60 ring-1 ring-salmon-200/40'
                        : 'bg-transparent hover:bg-stone-50'
                    )}
                  >
                    {/* Speaker label */}
                    {item.speaker && (
                      <span className="font-sans font-medium text-salmon-600 text-xs mb-1 block">
                        {item.speaker}:
                      </span>
                    )}

                    {/* Irish text with word-level interaction */}
                    <p className="font-sans text-base leading-snug text-stone-700 mb-1.5">
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
                      <p className="text-sm font-sans text-stone-500 italic leading-tight">
                        {item.translation}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            // ========== PARAGRAPH VIEW (Translations OFF) ==========
            <div className="space-y-5">
              {groupedItems.map((group, groupIndex) => {
                if (group.type === 'header') {
                  return (
                    <p key={`header-${groupIndex}`} className="mt-8 first:mt-0 mb-3 text-[11px] font-sans font-semibold text-stone-400 uppercase tracking-widest">
                      {group.text}
                    </p>
                  )
                }

                // Paragraph group
                return (
                  <div key={`para-${groupIndex}`} className="mb-4">
                    {/* Speaker label for paragraph */}
                    {group.speaker && (
                      <span className="font-sans font-medium text-salmon-600 text-xs mb-1 block">
                        {group.speaker}:
                      </span>
                    )}

                    {/* Flowing paragraph text */}
                    <p className="font-sans text-base leading-normal text-stone-700">
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

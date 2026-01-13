'use client'

import { useState, useEffect, useMemo, useCallback, useRef, type RefObject } from 'react'
import type { TranscriptItem, TranscriptWord } from '@/lib/types/database'

/**
 * Represents a word with its global index across all sentences
 */
interface IndexedWord {
  word: TranscriptWord
  globalIndex: number
  sentenceIndex: number
  wordIndexInSentence: number
}

/**
 * Binary search to find the word at a given time
 * Returns the index of the word whose time range contains the given time
 */
function findWordAtTime(words: IndexedWord[], time: number): number | null {
  if (words.length === 0) return null

  let left = 0
  let right = words.length - 1

  // Check if time is before first word
  if (time < words[0].word.start) return null

  // Check if time is after last word
  if (time > words[words.length - 1].word.end) return null

  // Binary search
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const word = words[mid].word

    if (time >= word.start && time <= word.end) {
      return mid
    }

    if (time < word.start) {
      right = mid - 1
    } else {
      left = mid + 1
    }
  }

  // Find the closest word if we're between words (in a gap)
  // Return the previous word if we're in a gap
  if (left > 0 && left < words.length) {
    const prevWord = words[left - 1].word
    const nextWord = words[left].word
    if (time > prevWord.end && time < nextWord.start) {
      return left - 1 // Return previous word during gaps
    }
  }

  return null
}

/**
 * Build a flat index of all words with their global positions
 */
function buildWordIndex(transcript: TranscriptItem[]): IndexedWord[] {
  const indexedWords: IndexedWord[] = []
  let globalIndex = 0
  let sentenceIndex = 0

  for (const item of transcript) {
    if (item.type === 'sentence') {
      for (let wordIndex = 0; wordIndex < item.words.length; wordIndex++) {
        indexedWords.push({
          word: item.words[wordIndex],
          globalIndex,
          sentenceIndex,
          wordIndexInSentence: wordIndex,
        })
        globalIndex++
      }
      sentenceIndex++
    }
  }

  return indexedWords
}

export interface TranscriptSyncState {
  /** Currently active word global index */
  activeWordIndex: number | null
  /** Currently active sentence index (among sentences only, not headers) */
  activeSentenceIndex: number | null
  /** Active word index within the current sentence */
  activeWordIndexInSentence: number | null
  /** Current playback time in seconds */
  currentTime: number
  /** Whether audio is currently playing */
  isPlaying: boolean
  /** Total duration of the audio */
  duration: number
  /** Seek to a specific time */
  seekTo: (time: number) => void
  /** Toggle play/pause */
  togglePlayPause: () => void
  /** Play audio */
  play: () => void
  /** Pause audio */
  pause: () => void
}

/**
 * Hook for synchronizing audio playback with transcript highlighting
 *
 * @param transcript - Array of transcript items (headers and sentences)
 * @param audioRef - Ref to the audio element
 * @returns Sync state including active word indices and playback controls
 *
 * @example
 * const { activeWordIndex, activeSentenceIndex, togglePlayPause } = useTranscriptSync(transcript, audioRef)
 */
export function useTranscriptSync(
  transcript: TranscriptItem[],
  audioRef: RefObject<HTMLAudioElement | null>
): TranscriptSyncState {
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)

  // Build word index once when transcript changes
  const wordIndex = useMemo(() => buildWordIndex(transcript), [transcript])

  // Find active word based on current time
  const activePosition = useMemo(() => {
    if (wordIndex.length === 0) {
      return {
        activeWordIndex: null,
        activeSentenceIndex: null,
        activeWordIndexInSentence: null,
      }
    }

    const index = findWordAtTime(wordIndex, currentTime)
    if (index === null) {
      return {
        activeWordIndex: null,
        activeSentenceIndex: null,
        activeWordIndexInSentence: null,
      }
    }

    const indexed = wordIndex[index]
    return {
      activeWordIndex: indexed.globalIndex,
      activeSentenceIndex: indexed.sentenceIndex,
      activeWordIndexInSentence: indexed.wordIndexInSentence,
    }
  }, [wordIndex, currentTime])

  // Track animation frame ID for cleanup
  const rafIdRef = useRef<number | null>(null)
  const isPlayingRef = useRef(false)

  // requestAnimationFrame loop for smooth time tracking
  const startTimeTracking = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    const tick = () => {
      if (!isPlayingRef.current) return

      setCurrentTime(audio.currentTime)
      rafIdRef.current = requestAnimationFrame(tick)
    }

    rafIdRef.current = requestAnimationFrame(tick)
  }, [audioRef])

  const stopTimeTracking = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
  }, [])

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => {
      isPlayingRef.current = true
      setIsPlaying(true)
      startTimeTracking()
    }

    const handlePause = () => {
      isPlayingRef.current = false
      setIsPlaying(false)
      stopTimeTracking()
      // Sync final time on pause
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      isPlayingRef.current = false
      setIsPlaying(false)
      stopTimeTracking()
    }

    const handleSeeked = () => {
      // Update time immediately after seeking
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleDurationChange = () => {
      setDuration(audio.duration)
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('seeked', handleSeeked)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('durationchange', handleDurationChange)

    // Initialize state from current audio state
    setCurrentTime(audio.currentTime)
    isPlayingRef.current = !audio.paused
    setIsPlaying(!audio.paused)
    if (audio.duration) {
      setDuration(audio.duration)
    }

    // Start tracking if already playing
    if (!audio.paused) {
      startTimeTracking()
    }

    return () => {
      stopTimeTracking()
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('seeked', handleSeeked)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('durationchange', handleDurationChange)
    }
  }, [audioRef, startTimeTracking, stopTimeTracking])

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0))
  }, [audioRef])

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play()
    } else {
      audio.pause()
    }
  }, [audioRef])

  const play = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.play()
  }, [audioRef])

  const pause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
  }, [audioRef])

  return {
    activeWordIndex: activePosition.activeWordIndex,
    activeSentenceIndex: activePosition.activeSentenceIndex,
    activeWordIndexInSentence: activePosition.activeWordIndexInSentence,
    currentTime,
    isPlaying,
    duration,
    seekTo,
    togglePlayPause,
    play,
    pause,
  }
}

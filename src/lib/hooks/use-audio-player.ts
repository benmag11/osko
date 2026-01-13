'use client'

import { useState, useEffect, useCallback, useRef, type RefObject } from 'react'

const STORAGE_KEY = 'addy-audio-preferences'

interface AudioPreferences {
  volume: number
  playbackRate: number
}

/**
 * Load saved audio preferences from localStorage
 */
function loadPreferences(): AudioPreferences {
  if (typeof window === 'undefined') {
    return { volume: 1, playbackRate: 1 }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const prefs = JSON.parse(stored) as AudioPreferences
      return {
        volume: Math.max(0, Math.min(1, prefs.volume ?? 1)),
        playbackRate: Math.max(0.5, Math.min(2, prefs.playbackRate ?? 1)),
      }
    }
  } catch {
    // Ignore localStorage errors
  }

  return { volume: 1, playbackRate: 1 }
}

/**
 * Save audio preferences to localStorage
 */
function savePreferences(prefs: AudioPreferences): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Ignore localStorage errors
  }
}

export interface AudioPlayerState {
  /** Whether audio is currently playing */
  isPlaying: boolean
  /** Current playback time in seconds */
  currentTime: number
  /** Total duration of the audio in seconds */
  duration: number
  /** Current volume (0-1) */
  volume: number
  /** Current playback rate (0.5-2) */
  playbackRate: number
  /** Whether audio is muted */
  isMuted: boolean
  /** Whether audio is currently loading */
  isLoading: boolean
  /** Whether audio has loaded enough to play */
  canPlay: boolean
  /** Play the audio */
  play: () => void
  /** Pause the audio */
  pause: () => void
  /** Toggle play/pause */
  togglePlayPause: () => void
  /** Seek to a specific time in seconds */
  seekTo: (time: number) => void
  /** Skip forward or backward by seconds (negative for backward) */
  skip: (seconds: number) => void
  /** Set volume (0-1) */
  setVolume: (volume: number) => void
  /** Set playback rate (0.5-2) */
  setPlaybackRate: (rate: number) => void
  /** Toggle mute state */
  toggleMute: () => void
}

/**
 * Hook for managing audio playback with volume, speed, and persistent preferences
 *
 * Extends basic playback controls with:
 * - Volume control with mute toggle
 * - Playback speed control (0.5x - 2x)
 * - Persistent preferences via localStorage
 * - Loading state tracking
 * - RAF-based smooth time tracking
 *
 * @param audioRef - Ref to the audio element
 * @returns Audio player state and controls
 *
 * @example
 * const audioRef = useRef<HTMLAudioElement>(null)
 * const { isPlaying, togglePlayPause, setPlaybackRate } = useAudioPlayer(audioRef)
 */
export function useAudioPlayer(
  audioRef: RefObject<HTMLAudioElement | null>
): AudioPlayerState {
  // Load initial preferences from localStorage
  const [preferences] = useState(loadPreferences)

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [canPlay, setCanPlay] = useState(false)

  // Audio settings
  const [volume, setVolumeState] = useState(preferences.volume)
  const [playbackRate, setPlaybackRateState] = useState(preferences.playbackRate)
  const [isMuted, setIsMuted] = useState(false)

  // Refs for RAF loop
  const rafIdRef = useRef<number | null>(null)
  const isPlayingRef = useRef(false)

  // Apply initial preferences to audio element
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume
    audio.playbackRate = playbackRate
  }, [audioRef, volume, playbackRate])

  // RAF loop for smooth time tracking (every frame for perfectly smooth slider)
  const startTimeTracking = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    const tick = () => {
      if (!isPlayingRef.current) return

      // Update every frame for smooth slider movement
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
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      isPlayingRef.current = false
      setIsPlaying(false)
      stopTimeTracking()
    }

    const handleSeeked = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const handleDurationChange = () => {
      setDuration(audio.duration)
    }

    const handleCanPlay = () => {
      setCanPlay(true)
      setIsLoading(false)
    }

    const handleWaiting = () => {
      setIsLoading(true)
    }

    const handlePlaying = () => {
      setIsLoading(false)
    }

    const handleLoadStart = () => {
      setIsLoading(true)
      setCanPlay(false)
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('seeked', handleSeeked)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('loadstart', handleLoadStart)

    // Initialize state from current audio state
    setCurrentTime(audio.currentTime)
    isPlayingRef.current = !audio.paused
    setIsPlaying(!audio.paused)
    if (audio.duration) {
      setDuration(audio.duration)
    }
    if (audio.readyState >= 3) {
      setCanPlay(true)
      setIsLoading(false)
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
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('loadstart', handleLoadStart)
    }
  }, [audioRef, startTimeTracking, stopTimeTracking])

  // Playback controls
  const play = useCallback(() => {
    audioRef.current?.play()
  }, [audioRef])

  const pause = useCallback(() => {
    audioRef.current?.pause()
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

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0))
  }, [audioRef])

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    const newTime = audio.currentTime + seconds
    audio.currentTime = Math.max(0, Math.min(newTime, audio.duration || 0))
  }, [audioRef])

  // Volume controls
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setVolumeState(clampedVolume)

    const audio = audioRef.current
    if (audio) {
      audio.volume = clampedVolume
      // Unmute if setting a non-zero volume
      if (clampedVolume > 0 && audio.muted) {
        audio.muted = false
        setIsMuted(false)
      }
    }

    // Save preference
    savePreferences({ volume: clampedVolume, playbackRate })
  }, [audioRef, playbackRate])

  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    const newMuted = !audio.muted
    audio.muted = newMuted
    setIsMuted(newMuted)
  }, [audioRef])

  // Playback rate controls
  const setPlaybackRate = useCallback((rate: number) => {
    const clampedRate = Math.max(0.5, Math.min(2, rate))
    setPlaybackRateState(clampedRate)

    const audio = audioRef.current
    if (audio) {
      audio.playbackRate = clampedRate
    }

    // Save preference
    savePreferences({ volume, playbackRate: clampedRate })
  }, [audioRef, volume])

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    isMuted,
    isLoading,
    canPlay,
    play,
    pause,
    togglePlayPause,
    seekTo,
    skip,
    setVolume,
    setPlaybackRate,
    toggleMute,
  }
}

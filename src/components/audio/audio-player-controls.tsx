'use client'

import { memo } from 'react'
import { Play, Pause, RotateCcw, RotateCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { AudioSpeedControls } from './audio-speed-controls'
import { AudioVolumeControl } from './audio-volume-control'

interface AudioPlayerControlsProps {
  /** Whether audio is currently playing */
  isPlaying: boolean
  /** Current playback time in seconds */
  currentTime: number
  /** Total duration of the audio in seconds */
  duration: number
  /** Whether audio is currently loading */
  isLoading: boolean
  /** Current volume (0-1) */
  volume: number
  /** Current playback rate (0.5-2) */
  playbackRate: number
  /** Whether audio is muted */
  isMuted: boolean
  /** Toggle play/pause */
  onTogglePlayPause: () => void
  /** Seek to a specific time in seconds */
  onSeek: (time: number) => void
  /** Skip forward or backward by seconds */
  onSkip: (seconds: number) => void
  /** Set volume (0-1) */
  onVolumeChange: (volume: number) => void
  /** Set playback rate (0.5-2) */
  onPlaybackRateChange: (rate: number) => void
  /** Toggle mute state */
  onToggleMute: () => void
  /** Whether controls are disabled */
  disabled?: boolean
  /** Use compact size variant (smaller buttons/icons) */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Shared audio player controls component
 *
 * Renders a compact inline control bar with:
 * [Skip -5s] [Play/Pause] [Skip +5s] [Time] [Progress Slider] [Speed] [Volume]
 *
 * This is a pure presentational component - all state is managed externally.
 */
export const AudioPlayerControls = memo(function AudioPlayerControls({
  isPlaying,
  currentTime,
  duration,
  isLoading,
  volume,
  playbackRate,
  isMuted,
  onTogglePlayPause,
  onSeek,
  onSkip,
  onVolumeChange,
  onPlaybackRateChange,
  onToggleMute,
  disabled = false,
  compact = false,
  className,
}: AudioPlayerControlsProps) {
  const handleProgressChange = (value: number[]) => {
    onSeek(value[0])
  }

  // Size classes based on compact prop
  const skipButtonClass = compact ? 'h-7 w-7' : 'h-7 w-7'
  const playButtonClass = compact ? 'h-7 w-7' : 'h-8 w-8'
  const iconClass = compact ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Skip back */}
      <button
        onClick={() => onSkip(-5)}
        disabled={disabled}
        aria-label="Skip backward 5 seconds"
        className={cn(
          skipButtonClass,
          'rounded-full flex items-center justify-center shrink-0 cursor-pointer',
          'text-stone-500 hover:bg-stone-200/60 hover:text-stone-700',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salmon-500',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        <RotateCcw className={iconClass} />
      </button>

      {/* Play/Pause */}
      <button
        onClick={onTogglePlayPause}
        disabled={disabled}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className={cn(
          playButtonClass,
          'rounded-full flex items-center justify-center shrink-0 cursor-pointer',
          'bg-salmon-500 text-white hover:bg-salmon-600',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salmon-500 focus-visible:ring-offset-1',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <Loader2 className={cn(iconClass, 'animate-spin')} />
        ) : isPlaying ? (
          <Pause className={iconClass} />
        ) : (
          <Play className={cn(iconClass, 'ml-0.5')} />
        )}
      </button>

      {/* Skip forward */}
      <button
        onClick={() => onSkip(5)}
        disabled={disabled}
        aria-label="Skip forward 5 seconds"
        className={cn(
          skipButtonClass,
          'rounded-full flex items-center justify-center shrink-0 cursor-pointer',
          'text-stone-500 hover:bg-stone-200/60 hover:text-stone-700',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salmon-500',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        <RotateCw className={iconClass} />
      </button>

      {/* Time */}
      <span className="text-xs text-stone-500 tabular-nums shrink-0 w-[70px] text-center">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {/* Progress bar */}
      <Slider
        value={[currentTime]}
        max={duration || 100}
        step={0.01}
        onValueChange={handleProgressChange}
        disabled={disabled || !duration}
        className="flex-1 min-w-[60px]"
        size={compact ? 'sm' : 'default'}
        aria-label="Audio progress"
      />

      {/* Speed controls */}
      <AudioSpeedControls
        playbackRate={playbackRate}
        onPlaybackRateChange={onPlaybackRateChange}
        className="shrink-0"
      />

      {/* Volume */}
      <AudioVolumeControl
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={onVolumeChange}
        onToggleMute={onToggleMute}
        className="shrink-0"
      />
    </div>
  )
})

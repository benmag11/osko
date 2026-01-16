'use client'

import { memo, useRef, useEffect, useState } from 'react'
import { Play, Pause, RotateCcw, RotateCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { useAudioPlayer } from '@/lib/hooks/use-audio-player'
import { AudioSpeedControls } from './audio-speed-controls'
import { AudioVolumeControl } from './audio-volume-control'
import { useInView } from 'react-intersection-observer'

interface AudioPlayerProps {
  audioUrl: string | undefined
  questionId?: string
  className?: string
  variant?: 'default' | 'embedded'
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Compact inline audio player with all controls in a single row
 */
export const AudioPlayer = memo(function AudioPlayer({
  audioUrl,
  questionId,
  className,
  variant = 'default',
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  const { ref: containerRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
    triggerOnce: true,
  })

  const [shouldLoadAudio, setShouldLoadAudio] = useState(false)

  useEffect(() => {
    if (inView && audioUrl) {
      setShouldLoadAudio(true)
    }
  }, [inView, audioUrl])

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    isMuted,
    isLoading,
    togglePlayPause,
    seekTo,
    skip,
    setVolume,
    setPlaybackRate,
    toggleMute,
  } = useAudioPlayer(audioRef)

  const handleProgressChange = (value: number[]) => {
    seekTo(value[0])
  }

  if (!audioUrl) return null

  return (
    <div
      ref={containerRef}
      className={cn(
        'px-3 py-2',
        variant === 'embedded'
          ? ''
          : 'rounded-lg bg-cream-100 border border-stone-200/80',
        className
      )}
      data-question-id={questionId}
    >
      <audio
        ref={audioRef}
        src={shouldLoadAudio ? audioUrl : undefined}
        preload={shouldLoadAudio ? 'metadata' : 'none'}
      />

      {/* Single row: all controls inline */}
      <div className="flex items-center gap-2">
        {/* Skip back */}
        <button
          onClick={() => skip(-5)}
          disabled={!shouldLoadAudio}
          aria-label="Skip backward 5 seconds"
          className={cn(
            'h-7 w-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer',
            'text-stone-500 hover:bg-stone-200/60 hover:text-stone-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salmon-500',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlayPause}
          disabled={!shouldLoadAudio}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className={cn(
            'h-7 w-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer',
            'bg-salmon-500 text-white hover:bg-salmon-600',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salmon-500 focus-visible:ring-offset-1',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5 ml-0.5" />
          )}
        </button>

        {/* Skip forward */}
        <button
          onClick={() => skip(5)}
          disabled={!shouldLoadAudio}
          aria-label="Skip forward 5 seconds"
          className={cn(
            'h-7 w-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer',
            'text-stone-500 hover:bg-stone-200/60 hover:text-stone-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salmon-500',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <RotateCw className="h-3.5 w-3.5" />
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
          disabled={!shouldLoadAudio || !duration}
          className="flex-1 min-w-[60px]"
          size="sm"
          aria-label="Audio progress"
        />

        {/* Speed controls */}
        <AudioSpeedControls
          playbackRate={playbackRate}
          onPlaybackRateChange={setPlaybackRate}
          className="shrink-0"
        />

        {/* Volume */}
        <AudioVolumeControl
          volume={volume}
          isMuted={isMuted}
          onVolumeChange={setVolume}
          onToggleMute={toggleMute}
          className="shrink-0"
        />
      </div>
    </div>
  )
})

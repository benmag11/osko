'use client'

import { memo } from 'react'
import { Volume2, Volume1, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AudioVerticalVolumeControlProps {
  volume: number
  isMuted: boolean
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
  className?: string
}

function getVolumeIcon(volume: number, isMuted: boolean) {
  if (isMuted || volume === 0) return VolumeX
  if (volume < 0.5) return Volume1
  return Volume2
}

/**
 * Vertical volume control with dropdown slider
 * Designed for the transcript reader's bottom control bar
 */
export const AudioVerticalVolumeControl = memo(function AudioVerticalVolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  className,
}: AudioVerticalVolumeControlProps) {
  const VolumeIcon = getVolumeIcon(volume, isMuted)
  const displayVolume = isMuted ? 0 : volume

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salmon-500',
          'hover:bg-stone-200 transition-colors',
          isMuted ? 'text-stone-400' : 'text-stone-500 hover:text-stone-700',
          className
        )}
        aria-label="Adjust volume"
      >
        <VolumeIcon className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="center"
        side="top"
        sideOffset={8}
        className="p-3 min-w-[44px] flex flex-col items-center gap-2"
      >
        {/* Vertical slider */}
        <div className="h-[100px] py-1">
          <Slider
            orientation="vertical"
            size="sm"
            value={[displayVolume * 100]}
            max={100}
            step={5}
            onValueChange={([val]) => onVolumeChange(val / 100)}
            className="h-full"
            aria-label="Volume level"
          />
        </div>

        {/* Mute toggle button at bottom */}
        <button
          onClick={onToggleMute}
          className={cn(
            'h-7 w-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer',
            'hover:bg-stone-100 transition-colors',
            isMuted ? 'text-stone-400' : 'text-stone-600'
          )}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          <VolumeIcon className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

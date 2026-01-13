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

interface AudioVolumeControlProps {
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
 * Minimal volume control - icon button with dropdown slider
 */
export const AudioVolumeControl = memo(function AudioVolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  className,
}: AudioVolumeControlProps) {
  const VolumeIcon = getVolumeIcon(volume, isMuted)
  const displayVolume = isMuted ? 0 : volume

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'h-7 w-7 rounded-full flex items-center justify-center cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salmon-500',
          'hover:bg-stone-200/60',
          isMuted ? 'text-stone-400' : 'text-stone-500 hover:text-stone-700',
          className
        )}
        aria-label="Adjust volume"
      >
        <VolumeIcon className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="top"
        sideOffset={8}
        className="p-2 min-w-[120px]"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className={cn(
              'h-6 w-6 rounded flex items-center justify-center shrink-0 cursor-pointer',
              'hover:bg-stone-100',
              isMuted ? 'text-stone-400' : 'text-stone-600'
            )}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon className="h-3.5 w-3.5" />
          </button>
          <Slider
            value={[displayVolume * 100]}
            max={100}
            step={5}
            onValueChange={([val]) => onVolumeChange(val / 100)}
            className="flex-1"
            aria-label="Volume level"
          />
          <span className="text-[10px] tabular-nums text-stone-500 w-7 text-right">
            {Math.round(displayVolume * 100)}%
          </span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

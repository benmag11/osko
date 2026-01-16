'use client'

import { memo } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AudioSpeedControlsProps {
  playbackRate: number
  onPlaybackRateChange: (rate: number) => void
  className?: string
}

const ALL_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const

function formatRate(rate: number): string {
  return `${rate}x`
}


/**
 * Speed control dropdown pill
 */
export const AudioSpeedControls = memo(function AudioSpeedControls({
  playbackRate,
  onPlaybackRateChange,
  className,
}: AudioSpeedControlsProps) {
  const isRateActive = (rate: number) => Math.abs(playbackRate - rate) < 0.01

  return (
    <div className={cn('flex items-center', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'flex items-center justify-between h-7 rounded-full px-2.5 w-[58px] cursor-pointer',
            'text-xs font-medium tabular-nums',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salmon-500',
            'border border-stone-200 bg-white hover:bg-stone-50',
            !isRateActive(1) && 'border-salmon-300 bg-salmon-50/50 text-salmon-600'
          )}
          aria-label="Change playback speed"
        >
          <span className={isRateActive(1) ? 'text-stone-600' : 'text-salmon-600'}>
            {formatRate(playbackRate)}
          </span>
          <ChevronDown className="h-3 w-3 text-stone-400" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="center" className="min-w-[80px]">
          {ALL_SPEEDS.map(rate => {
            const isActive = isRateActive(rate)

            return (
              <DropdownMenuItem
                key={rate}
                onClick={() => onPlaybackRateChange(rate)}
                className={cn(
                  'flex items-center justify-between cursor-pointer text-xs',
                  isActive && 'bg-salmon-50'
                )}
              >
                <span className={cn('tabular-nums', isActive && 'text-salmon-700')}>
                  {formatRate(rate)}
                </span>
                {isActive && <Check className="h-3.5 w-3.5 text-salmon-600" />}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})

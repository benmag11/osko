'use client'

import { memo } from 'react'
import { Turtle, Footprints, Rabbit, ChevronDown, Check } from 'lucide-react'
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

const SPEED_PRESETS = [
  { rate: 0.75, icon: Turtle, ariaLabel: '0.75x (slow)' },
  { rate: 1, icon: Footprints, ariaLabel: '1x (normal)' },
  { rate: 1.25, icon: Rabbit, ariaLabel: '1.25x (quick)' },
] as const

const ALL_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const

function formatRate(rate: number): string {
  return `${rate}x`
}

function getSpeedLabel(rate: number): string | null {
  if (rate === 0.75) return 'Slow'
  if (rate === 1) return 'Normal'
  if (rate === 1.25) return 'Quick'
  if (rate === 1.5) return 'Fast'
  if (rate === 2) return 'Fastest'
  return null
}

function getSpeedIcon(rate: number) {
  if (rate === 0.75) return Turtle
  if (rate === 1) return Footprints
  if (rate === 1.25) return Rabbit
  return null
}

/**
 * Compact speed controls - icon buttons + fixed-width dropdown
 */
export const AudioSpeedControls = memo(function AudioSpeedControls({
  playbackRate,
  onPlaybackRateChange,
  className,
}: AudioSpeedControlsProps) {
  const isRateActive = (rate: number) => Math.abs(playbackRate - rate) < 0.01

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {/* Animal icon buttons - hidden on mobile */}
      <div className="hidden sm:flex items-center">
        {SPEED_PRESETS.map(({ rate, icon: Icon, ariaLabel }) => (
          <button
            key={rate}
            onClick={() => onPlaybackRateChange(rate)}
            aria-label={ariaLabel}
            aria-pressed={isRateActive(rate)}
            className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salmon-500',
              isRateActive(rate)
                ? 'bg-salmon-100 text-salmon-600'
                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      {/* Speed dropdown - fixed width */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'flex items-center justify-between h-7 rounded-full px-2 w-[58px] cursor-pointer',
            'text-xs font-medium tabular-nums',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salmon-500',
            'border border-stone-200 bg-white hover:bg-stone-50',
            !isRateActive(1) && 'border-salmon-200 bg-salmon-50/50 text-salmon-600'
          )}
          aria-label="Change playback speed"
        >
          <span className={isRateActive(1) ? 'text-stone-600' : 'text-salmon-600'}>
            {formatRate(playbackRate)}
          </span>
          <ChevronDown className="h-3 w-3 text-stone-400" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="center" className="min-w-[130px]">
          {ALL_SPEEDS.map(rate => {
            const Icon = getSpeedIcon(rate)
            const label = getSpeedLabel(rate)
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
                <span className="flex items-center gap-1.5">
                  {Icon ? (
                    <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-salmon-600' : 'text-stone-400')} />
                  ) : (
                    <span className="w-3.5" />
                  )}
                  <span className={cn('tabular-nums', isActive && 'text-salmon-700')}>
                    {formatRate(rate)}
                  </span>
                  {label && (
                    <span className={cn('text-[10px]', isActive ? 'text-salmon-500' : 'text-stone-400')}>
                      {label}
                    </span>
                  )}
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

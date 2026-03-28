'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface YearPresenceStripProps {
  allYears: number[]
  yearList: number[]
  dotColor: string
}

export function YearPresenceStrip({ allYears, yearList, dotColor }: YearPresenceStripProps) {
  const yearSet = new Set(yearList)

  return (
    <TooltipProvider delayDuration={0}>
      <div className="relative overflow-hidden">
        <div className="flex items-center gap-[3px]">
          {allYears.map((year) => {
            const appeared = yearSet.has(year)
            return (
              <Tooltip key={year}>
                <TooltipTrigger asChild>
                  <span
                    className={`h-2.5 w-2.5 rounded-[2px] shrink-0 ${
                      appeared
                        ? dotColor
                        : 'bg-stone-100'
                    }`}
                  />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="text-xs px-2 py-1"
                >
                  {year}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
        {/* Gradient fade on mobile when strip overflows */}
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none sm:hidden" />
      </div>
    </TooltipProvider>
  )
}

'use client'

import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  size?: 'default' | 'sm'
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, size = 'default', orientation, ...props }, ref) => {
  const isVertical = orientation === 'vertical'

  return (
    <SliderPrimitive.Root
      ref={ref}
      orientation={orientation}
      className={cn(
        'relative flex touch-none select-none',
        // Horizontal (default)
        !isVertical && 'w-full items-center',
        // Vertical
        isVertical && 'h-full flex-col items-center',
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="track"
        className={cn(
          'relative grow overflow-hidden rounded-full bg-stone-200',
          // Horizontal track
          !isVertical && 'w-full',
          !isVertical && (size === 'sm' ? 'h-1' : 'h-1.5'),
          // Vertical track
          isVertical && 'h-full',
          isVertical && (size === 'sm' ? 'w-1' : 'w-1.5')
        )}
      >
        <SliderPrimitive.Range
          data-slot="range"
          className={cn(
            'absolute bg-salmon-500',
            !isVertical && 'h-full',
            isVertical && 'w-full'
          )}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="thumb"
        className={cn(
          'block rounded-full border border-salmon-500/50 bg-white shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-salmon-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
        )}
      />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }

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
>(({ className, size = 'default', ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track
      className={cn(
        'relative w-full grow overflow-hidden rounded-full bg-stone-200',
        size === 'sm' ? 'h-1' : 'h-1.5'
      )}
    >
      <SliderPrimitive.Range className="absolute h-full bg-salmon-500" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        'block rounded-full border border-salmon-500/50 bg-white shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-salmon-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
        size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
      )}
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }

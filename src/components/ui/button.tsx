import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium font-sans transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-hidden focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-stone-800 text-cream-50 hover:bg-stone-700 focus-visible:ring-stone-600/50",
        primary:
          "bg-salmon-500 text-white hover:bg-salmon-600 focus-visible:ring-salmon-600/50",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-stone-400 bg-transparent hover:bg-stone-50 hover:border-stone-500 text-warm-text-primary dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-stone-100 text-warm-text-secondary hover:bg-stone-200",
        ghost:
          "text-warm-text-primary font-semibold hover:bg-stone-100 hover:text-warm-text-primary dark:hover:bg-accent/50",
        link: "text-salmon-500 underline-offset-4 hover:underline hover:text-salmon-600",
      },
      size: {
        default: "h-9 px-6 py-2 has-[>svg]:px-5",
        sm: "h-8 rounded gap-1.5 px-6 has-[>svg]:px-5",
        lg: "h-10 rounded px-6 has-[>svg]:px-5",
        xl: "h-11 rounded px-9 text-base has-[>svg]:px-7",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

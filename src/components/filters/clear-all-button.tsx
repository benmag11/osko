'use client'

import { Button } from '@/components/ui/button'

interface ClearAllButtonProps {
  onClick: () => void
}

export function ClearAllButton({ onClick }: ClearAllButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className="border border-[rgb(217,119,87)] bg-[#fffefb] px-5 py-2 text-base font-normal text-[rgb(217,119,87)] shadow-none transition-colors hover:border-[rgb(194,65,12)] hover:bg-orange-50 hover:text-[rgb(194,65,12)]"
    >
      Clear all
    </Button>
  )
}
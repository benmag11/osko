'use client'

interface ClearFiltersButtonProps {
  onClick: () => void
}

export function ClearFiltersButton({ onClick }: ClearFiltersButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-md border border-[rgb(217,119,87)] bg-[#fffefb] px-5 py-2 text-base font-normal text-[rgb(217,119,87)] transition-colors hover:border-[rgb(194,65,12)] hover:bg-orange-50 hover:text-[rgb(194,65,12)]"
    >
      Clear all
    </button>
  )
}
'use client'

interface ClearFiltersButtonProps {
  onClick: () => void
}

export function ClearFiltersButton({ onClick }: ClearFiltersButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-md border border-salmon-500 bg-cream-50 px-5 py-2 text-base font-sans font-medium text-salmon-500 transition-colors hover:border-salmon-600 hover:bg-cream-100 hover:text-salmon-600"
    >
      Clear all
    </button>
  )
}
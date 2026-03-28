interface AnalysisFooterProps {
  totalYears: number
  minYear: number
  maxYear: number
}

export function AnalysisFooter({ totalYears, minYear, maxYear }: AnalysisFooterProps) {
  return (
    <p className="mt-8 text-center text-sm font-serif italic text-stone-400">
      Analysed from {totalYears} papers ({minYear}&ndash;{maxYear})
    </p>
  )
}

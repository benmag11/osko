import Link from 'next/link'
import { Settings } from 'lucide-react'
import { AnalysisHeader } from './analysis-header'

export function AnalysisEmptyState() {
  return (
    <div className="space-y-4">
      <AnalysisHeader />
      <div className="border-y border-stone-200 py-10 text-center">
        <p className="font-serif text-lg text-stone-600">
          You haven&apos;t added any subjects yet.
        </p>
        <p className="mt-2 text-sm text-stone-400">
          Go to Settings to add your subjects, then come back to see topic predictions.
        </p>
        <Link
          href="/dashboard/settings"
          className="group mt-5 inline-flex items-center gap-1.5 text-sm text-salmon-500 hover:text-salmon-600 transition-colors"
        >
          <Settings className="size-3.5" />
          <span className="group-hover:underline underline-offset-2">
            Add subjects
          </span>
        </Link>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Headphones } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <Headphones className="mx-auto h-16 w-16 text-stone-300 mb-4" />
        <h1 className="text-4xl font-bold text-stone-900 mb-2">
          Audio Subject Not Found
        </h1>
        <p className="text-lg text-stone-600 mb-8 max-w-md mx-auto">
          We couldn&apos;t find the audio subject you&apos;re looking for.
          It may have been moved or doesn&apos;t exist.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/dashboard/listening">
              Browse All Audio Subjects
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/study">
              Go to Study
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

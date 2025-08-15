import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-exam-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-exam-text-primary">
          Subject Not Found
        </h1>
        <p className="text-xl text-exam-text-secondary">
          The subject you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90">
            Back to Subjects
          </Button>
        </Link>
      </div>
    </main>
  )
}
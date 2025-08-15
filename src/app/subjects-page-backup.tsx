import Link from 'next/link'
import { GraduationCap, BookOpen, School } from 'lucide-react'
import { getSubjects } from '@/lib/supabase/queries'
import { generateSlug } from '@/lib/utils/slug'
import { Button } from '@/components/ui/button'

export default async function SubjectsPage() {
  const subjects = await getSubjects()
  
  // Group subjects by name
  const grouped = subjects.reduce((acc, subject) => {
    if (!acc[subject.name]) acc[subject.name] = []
    acc[subject.name].push(subject)
    return acc
  }, {} as Record<string, typeof subjects>)

  const levelIcons = {
    Higher: <GraduationCap className="h-5 w-5" />,
    Ordinary: <BookOpen className="h-5 w-5" />,
    Foundation: <School className="h-5 w-5" />,
  }

  return (
    <main className="min-h-screen bg-exam-background">
      <div className="container mx-auto max-w-6xl px-8 py-12">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-exam-text-primary">
              Select Your Subject
            </h1>
            <p className="text-xl text-exam-text-secondary">
              Choose a subject and level to start studying
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(grouped).map(([name, levels]) => (
              <div key={name} className="rounded-xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-2xl font-bold text-exam-text-primary">
                  {name}
                </h2>
                <div className="space-y-2">
                  {levels
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((subject) => (
                      <Link
                        key={subject.id}
                        href={`/subject/${generateSlug(subject)}`}
                      >
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3 h-12 hover:bg-primary hover:text-white"
                        >
                          {levelIcons[subject.level]}
                          <span>{subject.level} Level</span>
                        </Button>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
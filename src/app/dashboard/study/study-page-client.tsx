'use client'

import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { 
  BookOpen, 
  Calculator, 
  FlaskConical, 
  Globe2, 
  History, 
  Languages,
  Palette,
  Music,
  Briefcase,
  Cpu,
  Home,
  TreePine,
  Heart,
  FileText
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  'Mathematics': Calculator,
  'English': FileText,
  'Irish': TreePine,
  'Biology': Heart,
  'Chemistry': FlaskConical,
  'Physics': Cpu,
  'History': History,
  'Geography': Globe2,
  'French': Languages,
  'Spanish': Languages,
  'German': Languages,
  'Art': Palette,
  'Music': Music,
  'Business': Briefcase,
  'Agricultural Science': TreePine,
  'Home Economics': Home,
  'default': BookOpen
}

interface Subject {
  id: string
  name: string
  level: string
  slug: string | null
}

interface StudyPageClientProps {
  userName: string
  subjects: Subject[]
}

export function StudyPageClient({ userName, subjects }: StudyPageClientProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const getIcon = (subjectName: string) => {
    const Icon = iconMap[subjectName] || iconMap['default']
    return Icon
  }

  return (
    <main className="min-h-screen bg-exam-background">
      <div className="px-8 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-exam-neutral-dark mb-2">
              {getGreeting()}, {userName}
            </h1>
            <p className="text-lg text-exam-text-secondary">
              What are you studying today?
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-exam-neutral-dark">
              Your subjects
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => {
                const Icon = getIcon(subject.name)
                
                const cardContent = (
                  <Card 
                    className="p-6 bg-white border-exam-border hover:border-exam-border-secondary hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-exam-background rounded-lg">
                        <Icon className="h-6 w-6 text-exam-neutral" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-exam-text-primary">
                          {subject.name}
                        </h3>
                        <p className="text-sm text-exam-text-muted mt-1">
                          {subject.level} Level
                        </p>
                      </div>
                    </div>
                  </Card>
                )
                
                // If we have a slug, wrap in Link, otherwise show as disabled
                if (subject.slug) {
                  return (
                    <Link 
                      key={subject.id}
                      href={`/subject/${subject.slug}`}
                      className="block"
                    >
                      {cardContent}
                    </Link>
                  )
                }
                
                // Fallback for subjects without matching entries
                return (
                  <div key={subject.id} className="opacity-60 cursor-not-allowed">
                    {cardContent}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
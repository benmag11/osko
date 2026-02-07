'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Subject } from '@/lib/types/database'
import { getSubjectIcon } from '@/lib/utils/subject-icons'
import { isLcvpSubject } from '@/lib/utils/points-calculator'

interface SubjectCardProps {
  subjectName: string
  higherSubject?: Subject
  ordinarySubject?: Subject
  selectedLevel: 'Higher' | 'Ordinary' | null
  onSelectSubject: (subject: Subject) => void
}

export function SubjectCard({ 
  subjectName,
  higherSubject,
  ordinarySubject,
  selectedLevel,
  onSelectSubject
}: SubjectCardProps) {
  const Icon = getSubjectIcon(subjectName)
  const isLcvp = isLcvpSubject(subjectName)

  return (
    <Card className={cn(
      "border-stone-400 transition-colors",
      selectedLevel ? "bg-white" : "bg-stone-100"
    )}>
      <CardContent className="px-4 py-1 space-y-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-warm-text-muted flex-shrink-0" />
          <h3 className="font-serif font-medium text-base text-warm-text-primary text-left truncate">{subjectName}</h3>
        </div>
        <div className="flex gap-2">
          {isLcvp && higherSubject ? (
            <Button
              size="sm"
              variant={selectedLevel ? 'default' : 'outline'}
              onClick={() => onSelectSubject(higherSubject)}
              className={cn(
                "flex-1 h-7 text-xs",
                selectedLevel && "bg-salmon-500 hover:bg-salmon-600 text-cream-50"
              )}
            >
              Select
            </Button>
          ) : (
            <>
              {higherSubject && (
                <Button
                  size="sm"
                  variant={selectedLevel === 'Higher' ? 'default' : 'outline'}
                  onClick={() => onSelectSubject(higherSubject)}
                  className={cn(
                    "flex-1 h-7 text-xs",
                    selectedLevel === 'Higher' && "bg-salmon-500 hover:bg-salmon-600 text-cream-50"
                  )}
                >
                  Higher
                </Button>
              )}
              {ordinarySubject && (
                <Button
                  size="sm"
                  variant={selectedLevel === 'Ordinary' ? 'default' : 'outline'}
                  onClick={() => onSelectSubject(ordinarySubject)}
                  className={cn(
                    "flex-1 h-7 text-xs",
                    selectedLevel === 'Ordinary' && "bg-sky-500 hover:bg-sky-600 text-cream-50"
                  )}
                >
                  Ordinary
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
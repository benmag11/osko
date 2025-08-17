'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Calculator, 
  Leaf, 
  Sigma, 
  Palette, 
  Dna, 
  Briefcase, 
  FlaskRound, 
  Scroll, 
  Code, 
  HardHat, 
  Ruler, 
  TrendingUp, 
  Wrench, 
  BookOpen, 
  Globe, 
  Clock, 
  Home, 
  Award, 
  Music, 
  Atom, 
  Activity, 
  Zap, 
  Users, 
  Book, 
  Cpu,
  Globe2,
  type LucideIcon
} from 'lucide-react'

const subjectIcons: Record<string, LucideIcon> = {
  'Accounting': Calculator,
  'Agricultural Science': Leaf,
  'Applied Maths': Sigma,
  'Art': Palette,
  'Biology': Dna,
  'Business': Briefcase,
  'Chemistry': FlaskRound,
  'Classical Studies': Scroll,
  'Computer Science': Code,
  'Construction Studies': HardHat,
  'Design & Communication Graphics': Ruler,
  'Economics': TrendingUp,
  'Engineering': Wrench,
  'English': BookOpen,
  'French': Globe2,
  'Geography': Globe,
  'German': Globe2,
  'History': Clock,
  'Home Economics': Home,
  'Irish': Globe2,
  'Italian': Globe2,
  'Japanese': Globe2,
  'LCVP': Award,
  'Mathematics': Calculator,
  'Music': Music,
  'Phys-Chem': Atom,
  'Physical Education': Activity,
  'Physics': Zap,
  'Politics and Society': Users,
  'Religious Education': Book,
  'Spanish': Globe2,
  'Technology': Cpu
}

interface SubjectCardProps {
  subject: string
  selectedLevel: 'Higher' | 'Ordinary' | null
  onSelectLevel: (level: 'Higher' | 'Ordinary') => void
}

export function SubjectCard({ 
  subject, 
  selectedLevel,
  onSelectLevel
}: SubjectCardProps) {
  const Icon = subjectIcons[subject] || Book // Default to Book icon if not found
  
  return (
    <Card className="border-[#e5e5e5] hover:shadow-sm transition-shadow">
      <CardContent className="px-3 py-1.5 space-y-1">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[#757575] flex-shrink-0" />
          <h3 className="font-medium text-base text-left truncate">{subject}</h3>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={selectedLevel === 'Higher' ? 'default' : 'outline'}
            onClick={() => onSelectLevel('Higher')}
            className={cn(
              "flex-1 h-7 text-xs",
              selectedLevel === 'Higher' && "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            Higher
          </Button>
          <Button
            size="sm"
            variant={selectedLevel === 'Ordinary' ? 'default' : 'outline'}
            onClick={() => onSelectLevel('Ordinary')}
            className={cn(
              "flex-1 h-7 text-xs",
              selectedLevel === 'Ordinary' && "bg-green-600 hover:bg-green-700 text-white"
            )}
          >
            Ordinary
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
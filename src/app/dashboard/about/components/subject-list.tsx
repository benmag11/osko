import { Check } from 'lucide-react'

const availableSubjects = [
  'Applied Maths',
  'Biology',
  'Chemistry',
  'Computer Science',
  'English',
  'French',
  'History',
  'Mathematics',
  'Physics',
]

const comingSoonSubjects = [
  'Construction',
  'Geography',
  'German',
  'Irish',
  'Physical Education',
  'Spanish',
]

export function SubjectList() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
      {/* Available Now */}
      <div>
        <h3 className="text-sm font-sans font-medium uppercase tracking-wider text-stone-400 mb-6">
          Available Now
        </h3>
        <ul className="space-y-3">
          {availableSubjects.map((subject) => (
            <li
              key={subject}
              className="flex items-center gap-3 text-warm-text-primary"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-sky-600" strokeWidth={3} />
              </span>
              <span className="font-serif text-lg">{subject}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Coming Soon */}
      <div>
        <h3 className="text-sm font-sans font-medium uppercase tracking-wider text-stone-400 mb-6">
          Coming December
        </h3>
        <ul className="space-y-3">
          {comingSoonSubjects.map((subject) => (
            <li
              key={subject}
              className="flex items-center gap-3 text-warm-text-secondary"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-stone-200" />
              <span className="font-serif text-lg">{subject}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

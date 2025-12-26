import { Check, Circle } from 'lucide-react'

interface SubjectStatus {
  name: string
  isCompleted: boolean
  expectedDate?: string
}

const subjects: SubjectStatus[] = [
  { name: 'Applied Maths', isCompleted: true },
  { name: 'Biology', isCompleted: true },
  { name: 'Chemistry', isCompleted: true },
  { name: 'Computer Science', isCompleted: true },
  { name: 'Construction', isCompleted: false, expectedDate: 'December 31st' },
  { name: 'English', isCompleted: true },
  { name: 'French', isCompleted: true },
  { name: 'Geography', isCompleted: false, expectedDate: 'December 31st' },
  { name: 'German', isCompleted: false, expectedDate: 'December 31st' },
  { name: 'History', isCompleted: true },
  { name: 'Irish', isCompleted: false, expectedDate: 'December 31st' },
  { name: 'Mathematics', isCompleted: true },
  { name: 'Physical Education', isCompleted: false, expectedDate: 'December 31st' },
  { name: 'Physics', isCompleted: true },
  { name: 'Spanish', isCompleted: false, expectedDate: 'December 31st' },
]

export function SubjectStatusTable() {
  // Sort subjects: completed first, then pending
  const sortedSubjects = [...subjects].sort((a, b) => {
    if (a.isCompleted && !b.isCompleted) return -1
    if (!a.isCompleted && b.isCompleted) return 1
    return 0
  })

  return (
    <div className="mt-10 overflow-hidden rounded-lg border border-stone-200 bg-white">
      <table className="hidden sm:table w-full">
        <thead>
          <tr className="border-b border-sky-200 bg-sky-50">
            <th className="px-6 py-4 text-left text-sm font-medium text-sky-900">
              Subject
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-sky-900">
              Status
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-sky-900">
              Expected Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {sortedSubjects.map((subject) => (
            <tr 
              key={subject.name}
              className={`
                transition-colors hover:bg-cream-50/50
                ${subject.isCompleted ? 'bg-cream-50/30' : 'bg-white'}
              `}
            >
              <td className={`
                px-6 py-4 text-sm font-medium
                ${subject.isCompleted ? 'text-stone-500' : 'text-warm-text-primary'}
              `}>
                {subject.name}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  {subject.isCompleted ? (
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-sky-600" />
                      <span className="text-sm text-stone-500">Completed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Circle className="h-5 w-5 text-stone-300" />
                      <span className="text-sm text-warm-text-secondary">Pending</span>
                    </div>
                  )}
                </div>
              </td>
              <td className={`
                px-6 py-4 text-sm
                ${subject.isCompleted ? 'text-stone-400' : 'text-warm-text-secondary'}
              `}>
                {subject.expectedDate || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Mobile view */}
      <div className="sm:hidden">
        {sortedSubjects.map((subject) => (
          <div 
            key={`${subject.name}-mobile`}
            className={`
              border-b border-stone-100 p-4
              ${subject.isCompleted ? 'bg-cream-50/30' : 'bg-white'}
            `}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`
                font-medium
                ${subject.isCompleted ? 'text-stone-500' : 'text-warm-text-primary'}
              `}>
                {subject.name}
              </span>
              <div className="flex items-center">
                {subject.isCompleted ? (
                  <Check className="h-5 w-5 text-sky-600" />
                ) : (
                  <Circle className="h-5 w-5 text-stone-300" />
                )}
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className={subject.isCompleted ? 'text-stone-500' : 'text-warm-text-secondary'}>
                {subject.isCompleted ? 'Completed' : 'Pending'}
              </span>
              {subject.expectedDate && (
                <span className="text-warm-text-muted">
                  {subject.expectedDate}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
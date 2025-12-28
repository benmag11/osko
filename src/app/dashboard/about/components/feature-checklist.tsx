import { Check } from 'lucide-react'

interface Feature {
  title: string
  description: string
  status: 'done' | 'building' | 'planned'
}

const features: Feature[] = [
  {
    title: 'Past Questions Archive',
    description: 'Filter all past exam questions by topic, question number, keyword, and year.',
    status: 'done',
  },
  {
    title: 'Progress Tracking',
    description: 'Mark each time you do a question, see your stats.',
    status: 'building',
  },
  {
    title: 'Exam Paper Archive',
    description: 'View and download any past exam paper.',
    status: 'building',
  },
  {
    title: 'Resource Archive',
    description: 'A big index of all online resources for each subject.',
    status: 'planned',
  },
  {
    title: 'Worked Solutions for Maths',
    description: 'Fully worked solutions for all past Maths questions.',
    status: 'planned',
  },
  {
    title: 'Flashcards',
    description: 'Spaced-repetition flashcards for definitions and rote-learnable material.',
    status: 'planned',
  },
]

function StatusIndicator({ status }: { status: Feature['status'] }) {
  if (status === 'done') {
    return (
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center">
        <Check className="w-3.5 h-3.5 text-sky-600" strokeWidth={3} />
      </span>
    )
  }

  if (status === 'building') {
    return (
      <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-orange-300 flex items-center justify-center">
        <span className="w-2 h-2 rounded-full bg-orange-400" />
      </span>
    )
  }

  return (
    <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-stone-200" />
  )
}

function StatusLabel({ status }: { status: Feature['status'] }) {
  const labels = {
    done: { text: 'Live', className: 'text-sky-600 bg-sky-50' },
    building: { text: 'Building', className: 'text-orange-600 bg-orange-50' },
    planned: { text: 'Planned', className: 'text-stone-500 bg-stone-100' },
  }

  const { text, className } = labels[status]

  return (
    <span className={`text-xs font-sans font-medium px-2 py-0.5 rounded ${className}`}>
      {text}
    </span>
  )
}

export function FeatureChecklist() {
  return (
    <div className="space-y-6">
      {features.map((feature) => (
        <div key={feature.title} className="flex gap-4">
          <StatusIndicator status={feature.status} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h4 className="font-serif text-lg text-warm-text-primary">
                {feature.title}
              </h4>
              <StatusLabel status={feature.status} />
            </div>
            <p className="text-warm-text-secondary font-sans text-base leading-relaxed">
              {feature.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

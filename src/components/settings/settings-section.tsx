import { cn } from '@/lib/utils'

interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function SettingsSection({ 
  title, 
  description, 
  children, 
  className 
}: SettingsSectionProps) {
  return (
    <div className={className}>
      <h2 className="text-xl font-serif font-semibold text-warm-text-primary mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-warm-text-muted -mt-2 mb-4">
          {description}
        </p>
      )}
      <div className={cn("bg-cream-100 rounded-lg border border-stone-300")}>
        {children}
      </div>
    </div>
  )
}
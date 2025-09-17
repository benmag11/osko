import { cn } from '@/lib/utils'

interface DashboardPageProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'max-w-4xl' | 'max-w-6xl' | 'max-w-7xl'
}

export function DashboardPage({ 
  children, 
  className,
  maxWidth = 'max-w-4xl' 
}: DashboardPageProps) {
  return (
    <div className={cn("flex-1 bg-cream-base", className)}>
      <div className="px-8 py-8">
        <div className={cn("mx-auto", maxWidth)}>
          {children}
        </div>
      </div>
    </div>
  )
}
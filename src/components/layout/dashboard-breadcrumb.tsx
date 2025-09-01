'use client'

import { usePathname } from 'next/navigation'

export function DashboardBreadcrumb() {
  const pathname = usePathname()
  
  const getPageName = () => {
    const segments = pathname.split('/')
    const lastSegment = segments[segments.length - 1]
    
    switch(lastSegment) {
      case 'study':
        return 'Study'
      case 'about':
        return 'About'
      case 'statistics':
        return 'Statistics'
      case 'settings':
        return 'Settings'
      default:
        return 'Dashboard'
    }
  }
  
  return (
    <div className="text-sm text-muted-foreground">
      {getPageName()}
    </div>
  )
}
'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queries/query-keys'
import type { DashboardBootstrapPayload } from '@/lib/supabase/dashboard-bootstrap'
import { generateSlug } from '@/lib/utils/slug'

interface DashboardDataProviderProps {
  bootstrap: DashboardBootstrapPayload
  children: React.ReactNode
}

export function DashboardDataProvider({ bootstrap, children }: DashboardDataProviderProps) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const sessionUser = bootstrap.session?.user
    if (!sessionUser) {
      return
    }

    const userId = sessionUser.id

    queryClient.setQueryData(queryKeys.user.profile(userId), {
      user: sessionUser,
      profile: bootstrap.profile,
    })

    const subjectsWithSlug = bootstrap.userSubjects.map((userSubject) => ({
      ...userSubject.subject,
      slug: generateSlug(userSubject.subject),
    }))

    queryClient.setQueryData(queryKeys.user.subjects(userId), subjectsWithSlug)
    queryClient.setQueryData(queryKeys.subjects(), bootstrap.allSubjects)
    queryClient.setQueryData(queryKeys.user.admin(userId), bootstrap.isAdmin)
  }, [bootstrap, queryClient])

  return <>{children}</>
}

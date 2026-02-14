import type { Filters } from '@/lib/types/database'

/**
 * Query keys for React Query cache management
 * All user-specific queries should be scoped with user ID
 */
export const queryKeys = {
  // Public data queries (no user context needed)
  all: ['questions'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: Filters) => [...queryKeys.lists(), filters] as const,
  infinite: (filters: Filters) => [...queryKeys.list(filters), 'infinite'] as const,
  navigation: (filters: Filters) => [...queryKeys.list(filters), 'navigation'] as const,
  subjects: () => ['subjects'] as const,
  subject: (slug: string) => [...queryKeys.subjects(), slug] as const,
  topics: (subjectId: string) => ['topics', subjectId] as const,
  years: (subjectId: string) => ['years', subjectId] as const,
  auditHistory: (questionId: string) => ['audit-history', questionId] as const,
  
  // User-specific queries (require user context)
  user: {
    profile: (userId: string) => ['user', userId, 'profile'] as const,
    subjects: (userId: string) => ['user', userId, 'subjects'] as const,
    preferences: (userId: string) => ['user', userId, 'preferences'] as const,
    progress: (userId: string) => ['user', userId, 'progress'] as const,
    admin: (userId: string) => ['user', userId, 'admin'] as const,
    completions: (userId: string) => ['user', userId, 'completions'] as const,
  },
}
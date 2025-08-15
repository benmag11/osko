import type { Filters } from '@/lib/types/database'

export const queryKeys = {
  all: ['questions'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: Filters) => [...queryKeys.lists(), filters] as const,
  infinite: (filters: Filters) => [...queryKeys.list(filters), 'infinite'] as const,
  subjects: () => ['subjects'] as const,
  subject: (slug: string) => [...queryKeys.subjects(), slug] as const,
  topics: (subjectId: string) => ['topics', subjectId] as const,
  years: (subjectId: string) => ['years', subjectId] as const,
}
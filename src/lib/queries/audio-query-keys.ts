import type { AudioFilters } from '@/lib/types/database'

/**
 * Query keys for audio question React Query cache management
 * Follows the same pattern as normal questions but with 'audio' prefix
 */
export const audioQueryKeys = {
  // Base key for all audio queries
  all: ['audio-questions'] as const,

  // List queries with filters
  lists: () => [...audioQueryKeys.all, 'list'] as const,
  list: (filters: AudioFilters) => [...audioQueryKeys.lists(), filters] as const,
  infinite: (filters: AudioFilters) => [...audioQueryKeys.list(filters), 'infinite'] as const,
  navigation: (filters: AudioFilters) => [...audioQueryKeys.list(filters), 'navigation'] as const,

  // Audio-specific queries
  subjects: () => ['audio-subjects'] as const,
  subject: (slug: string) => [...audioQueryKeys.subjects(), slug] as const,
  topics: (subjectId: string) => ['audio-topics', subjectId] as const,
  years: (subjectId: string) => ['audio-years', subjectId] as const,

  // Transcript data (cached separately for lazy loading)
  transcript: (mapJsonUrl: string) => ['audio-transcript', mapJsonUrl] as const,
}

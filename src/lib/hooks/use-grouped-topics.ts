'use client'

import { useQuery } from '@tanstack/react-query'
import { getTopics, getTopicGroups } from '@/lib/supabase/queries'
import { CACHE_TIMES } from '@/lib/config/cache'
import type { Topic, TopicGroup, GroupedTopics } from '@/lib/types/database'

/**
 * Transforms a flat list of topics and groups into a hierarchical structure
 * for the collapsible topic sidebar.
 *
 * @param topics - Flat array of topics from the database
 * @param groups - Array of topic groups from the database
 * @returns GroupedTopics structure with ungrouped topics first, then groups
 */
function groupTopics(topics: Topic[], groups: TopicGroup[]): GroupedTopics {
  const ungrouped: Topic[] = []
  const groupedMap = new Map<string, Topic[]>()

  // Sort topics alphabetically and separate by group
  const sortedTopics = [...topics].sort((a, b) => a.name.localeCompare(b.name))

  sortedTopics.forEach(topic => {
    if (topic.group_id === null) {
      ungrouped.push(topic)
    } else {
      const existing = groupedMap.get(topic.group_id) || []
      existing.push(topic)
      groupedMap.set(topic.group_id, existing)
    }
  })

  // Build groups array, sorted alphabetically, excluding empty groups
  const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name))

  const groupsWithTopics = sortedGroups
    .filter(group => groupedMap.has(group.id))
    .map(group => ({
      group,
      topics: groupedMap.get(group.id)!
    }))

  return {
    ungrouped,
    groups: groupsWithTopics
  }
}

/**
 * Hook for fetching topics organized into collapsible groups.
 *
 * Fetches both topics and topic_groups in parallel, then transforms
 * them into a hierarchical structure for the sidebar UI.
 *
 * @param subjectId - The subject ID to fetch topics for
 * @returns Object containing groupedTopics, flat topics array, and loading state
 */
export function useGroupedTopics(subjectId: string) {
  // Fetch topics
  const {
    data: topics,
    isLoading: topicsLoading,
    error: topicsError
  } = useQuery({
    queryKey: ['topics', subjectId],
    queryFn: () => getTopics(subjectId),
    ...CACHE_TIMES.TOPICS,
    enabled: !!subjectId
  })

  // Fetch topic groups
  const {
    data: topicGroups,
    isLoading: groupsLoading,
    error: groupsError
  } = useQuery({
    queryKey: ['topicGroups', subjectId],
    queryFn: () => getTopicGroups(subjectId),
    ...CACHE_TIMES.TOPICS,
    enabled: !!subjectId
  })

  // Combine and group the data when both are available
  const groupedTopics = topics && topicGroups
    ? groupTopics(topics, topicGroups)
    : null

  return {
    groupedTopics,
    topics: topics || [],
    isLoading: topicsLoading || groupsLoading,
    error: topicsError || groupsError
  }
}

import type { Filters } from '@/lib/types/database'

// Mapping between filter keys and URL parameter names
const FILTER_PARAM_MAP = {
  searchTerm: 'q',
  topicIds: 'topics',
  years: 'years',
  examTypes: 'types',
} as const

// Helper to serialize filter values to URL parameters
function serializeFilterValue<K extends keyof Omit<Filters, 'subjectId'>>(
  key: K,
  value: Filters[K]
): string | null {
  if (!value) return null
  
  switch (key) {
    case 'searchTerm':
      return value as string
    case 'topicIds':
    case 'examTypes':
      const strArray = value as string[]
      return strArray.length > 0 ? strArray.join(',') : null
    case 'years':
      const numArray = value as number[]
      return numArray.length > 0 ? numArray.join(',') : null
    default:
      return null
  }
}

// Overloaded function signatures for proper typing
function deserializeFilterValue(key: 'searchTerm', value: string | undefined): string | undefined
function deserializeFilterValue(key: 'topicIds' | 'examTypes', value: string | undefined): string[] | undefined
function deserializeFilterValue(key: 'years', value: string | undefined): number[] | undefined
function deserializeFilterValue(
  key: keyof Omit<Filters, 'subjectId'>,
  value: string | undefined
): string | string[] | number[] | undefined {
  if (!value) return undefined
  
  switch (key) {
    case 'searchTerm':
      return value
    case 'topicIds':
    case 'examTypes':
      return value.split(',').filter(Boolean)
    case 'years':
      return value.split(',').map(Number).filter(Boolean)
    default:
      return undefined
  }
}

export function parseSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
  subjectId: string
): Filters {
  const getValue = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) || undefined
    }
    const value = searchParams[key]
    return Array.isArray(value) ? value[0] : value
  }

  return {
    subjectId,
    searchTerm: deserializeFilterValue('searchTerm', getValue(FILTER_PARAM_MAP.searchTerm)),
    topicIds: deserializeFilterValue('topicIds', getValue(FILTER_PARAM_MAP.topicIds)),
    years: deserializeFilterValue('years', getValue(FILTER_PARAM_MAP.years)),
    examTypes: deserializeFilterValue('examTypes', getValue(FILTER_PARAM_MAP.examTypes)),
  }
}

export function buildFilterUrl(
  pathname: string,
  filters: Partial<Filters>
): string {
  const params = new URLSearchParams()

  // Use the shared serialization logic
  Object.entries(FILTER_PARAM_MAP).forEach(([filterKey, paramName]) => {
    const key = filterKey as keyof Omit<Filters, 'subjectId'>
    if (key in filters) {
      const value = filters[key]
      const serialized = serializeFilterValue(key, value as Filters[typeof key])
      if (serialized) {
        params.set(paramName, serialized)
      }
    }
  })

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function updateSearchParams(
  currentParams: URLSearchParams,
  updates: Partial<Filters>
): URLSearchParams {
  const params = new URLSearchParams(currentParams.toString())

  // Use the shared serialization logic
  Object.entries(FILTER_PARAM_MAP).forEach(([filterKey, paramName]) => {
    const key = filterKey as keyof Omit<Filters, 'subjectId'>
    if (key in updates) {
      const value = updates[key]
      const serialized = serializeFilterValue(key, value as Filters[typeof key])
      if (serialized) {
        params.set(paramName, serialized)
      } else {
        params.delete(paramName)
      }
    }
  })

  return params
}
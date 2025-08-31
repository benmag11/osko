import type { Filters } from '@/lib/types/database'

// Mapping between filter keys and URL parameter names
const FILTER_PARAM_MAP = {
  searchTerms: 'q',
  topicIds: 'topics',
  years: 'years',
  examTypes: 'types',
  questionNumbers: 'questions',
} as const

// Type guard to check if value is a string array
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

// Type guard to check if value is a number array
function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(item => typeof item === 'number')
}

// Helper to serialize filter values to URL parameters
function serializeFilterValue<K extends keyof Omit<Filters, 'subjectId'>>(
  key: K,
  value: Filters[K]
): string | null {
  if (!value) return null
  
  switch (key) {
    case 'searchTerms':
    case 'topicIds':
    case 'examTypes':
      if (!isStringArray(value)) {
        console.warn(`Expected string array for ${key}, got`, value)
        return null
      }
      return value.length > 0 ? value.join(',') : null
    case 'years':
    case 'questionNumbers':
      if (!isNumberArray(value)) {
        console.warn(`Expected number array for ${key}, got`, value)
        return null
      }
      return value.length > 0 ? value.join(',') : null
    default:
      return null
  }
}

// Overloaded function signatures for proper typing
function deserializeFilterValue(key: 'searchTerms' | 'topicIds' | 'examTypes', value: string | undefined): string[] | undefined
function deserializeFilterValue(key: 'years' | 'questionNumbers', value: string | undefined): number[] | undefined
function deserializeFilterValue(
  key: keyof Omit<Filters, 'subjectId'>,
  value: string | undefined
): string[] | number[] | undefined {
  if (!value) return undefined
  
  switch (key) {
    case 'searchTerms':
    case 'topicIds':
    case 'examTypes':
      return value.split(',').filter(Boolean)
    case 'years':
    case 'questionNumbers':
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
    searchTerms: deserializeFilterValue('searchTerms', getValue(FILTER_PARAM_MAP.searchTerms)),
    topicIds: deserializeFilterValue('topicIds', getValue(FILTER_PARAM_MAP.topicIds)),
    years: deserializeFilterValue('years', getValue(FILTER_PARAM_MAP.years)),
    examTypes: deserializeFilterValue('examTypes', getValue(FILTER_PARAM_MAP.examTypes)),
    questionNumbers: deserializeFilterValue('questionNumbers', getValue(FILTER_PARAM_MAP.questionNumbers)),
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
      if (value !== undefined) {
        const serialized = serializeFilterValue(key, value as Filters[typeof key])
        if (serialized) {
          params.set(paramName, serialized)
        }
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
      if (value !== undefined) {
        const serialized = serializeFilterValue(key, value as Filters[typeof key])
        if (serialized) {
          params.set(paramName, serialized)
        } else {
          params.delete(paramName)
        }
      } else {
        params.delete(paramName)
      }
    }
  })

  return params
}
import type { Subject } from '@/lib/types/database'

export function generateSlug(subject: Subject): string {
  const name = subject.name.toLowerCase().replace(/\s+/g, '-')
  if (name === 'lcvp') return 'lcvp'
  const level = subject.level.toLowerCase()
  return `${name}-${level}`
}

export function parseSlug(slug: string): { name: string; level: string } {
  if (slug === 'lcvp') {
    return { name: 'LCVP', level: 'Higher' }
  }

  const parts = slug.split('-')
  const level = parts[parts.length - 1]
  const name = parts.slice(0, -1).join(' ')

  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    level: level.charAt(0).toUpperCase() + level.slice(1)
  }
}

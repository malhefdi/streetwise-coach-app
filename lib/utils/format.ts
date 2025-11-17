import { format, formatDistance, formatRelative } from 'date-fns'

/**
 * Format a date to a readable string
 */
export function formatDate(date: string | Date, formatStr: string = 'PPP'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, formatStr)
}

/**
 * Format a date relative to now (e.g., "2 hours ago")
 */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistance(d, new Date(), { addSuffix: true })
}

/**
 * Format a date relative to now (e.g., "yesterday at 3:00 PM")
 */
export function formatRelativeDatetime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatRelative(d, new Date())
}

/**
 * Format duration in minutes to readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

/**
 * Format percentage with optional decimal places
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Get belt color for rank
 */
export function getBeltColor(rank: string): string {
  const rankLower = rank.toLowerCase()
  if (rankLower.includes('white')) return 'white'
  if (rankLower.includes('blue')) return 'blue'
  if (rankLower.includes('purple')) return 'purple'
  if (rankLower.includes('brown')) return 'brown'
  if (rankLower.includes('black')) return 'black'
  return 'white'
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

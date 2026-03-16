import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string): string {
  const d = new Date(date)
  if (isToday(d)) {
    return `Today at ${format(d, 'h:mm a')}`
  }
  if (isTomorrow(d)) {
    return `Tomorrow at ${format(d, 'h:mm a')}`
  }
  return format(d, 'MMM d, yyyy h:mm a')
}

export function formatDateShort(date: string): string {
  return format(new Date(date), 'MMM d')
}

export function formatTime(date: string): string {
  return format(new Date(date), 'h:mm a')
}

export function formatDuration(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffMs = endDate.getTime() - startDate.getTime()
  const diffMins = Math.round(diffMs / 60000)
  if (diffMins < 60) return `${diffMins}m`
  const hours = Math.floor(diffMins / 60)
  const mins = diffMins % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export function formatRelative(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function truncate(str: string, n: number): string {
  if (str.length <= n) return str
  return str.slice(0, n - 1) + '…'
}

export function getDomainFromEmail(email: string): string {
  return email.split('@')[1] ?? ''
}

export function getPlanLimit(plan: 'free' | 'starter' | 'pro'): number | null {
  switch (plan) {
    case 'free':
      return 3
    case 'starter':
      return 20
    case 'pro':
      return null
  }
}

export function isOverLimit(
  plan: 'free' | 'starter' | 'pro',
  briefs_generated_this_month: number
): boolean {
  const limit = getPlanLimit(plan)
  if (limit === null) return false
  return briefs_generated_this_month >= limit
}

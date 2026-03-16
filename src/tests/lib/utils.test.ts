import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  formatDate,
  formatDateShort,
  formatTime,
  formatDuration,
  truncate,
  getDomainFromEmail,
  getPlanLimit,
  isOverLimit,
  isPersonalEmailDomain,
} from '@/lib/utils'

// ─── cn ───────────────────────────────────────────────────────────────────────

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates Tailwind classes (last wins)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('handles undefined / null gracefully', () => {
    expect(cn(undefined, null, 'cls')).toBe('cls')
  })
})

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  beforeEach(() => {
    // Pin "now" to 2024-06-15T08:00:00Z
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T08:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Today at ..." for a date that is today', () => {
    const result = formatDate('2024-06-15T14:30:00')
    expect(result).toMatch(/^Today at/)
  })

  it('returns "Tomorrow at ..." for a date that is tomorrow', () => {
    const result = formatDate('2024-06-16T09:00:00')
    expect(result).toMatch(/^Tomorrow at/)
  })

  it('returns full date format for dates further in the future', () => {
    const result = formatDate('2024-07-20T10:00:00')
    expect(result).toMatch(/Jul 20, 2024/)
  })
})

// ─── formatDateShort ──────────────────────────────────────────────────────────

describe('formatDateShort', () => {
  it('returns abbreviated month + day', () => {
    expect(formatDateShort('2024-12-25T10:00:00')).toBe('Dec 25')
  })
})

// ─── formatTime ───────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('returns 12-hour time with am/pm', () => {
    // Use a fixed local-time offset-aware string
    const result = formatTime('2024-01-01T09:30:00')
    expect(result).toMatch(/9:30 AM/i)
  })
})

// ─── formatDuration ──────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('returns minutes only for durations < 1 hour', () => {
    expect(formatDuration('2024-01-01T09:00:00', '2024-01-01T09:45:00')).toBe('45m')
  })

  it('returns hours only for exact-hour durations', () => {
    expect(formatDuration('2024-01-01T09:00:00', '2024-01-01T11:00:00')).toBe('2h')
  })

  it('returns hours + minutes for mixed durations', () => {
    expect(formatDuration('2024-01-01T09:00:00', '2024-01-01T10:30:00')).toBe('1h 30m')
  })

  it('returns 0m for same start and end', () => {
    expect(formatDuration('2024-01-01T09:00:00', '2024-01-01T09:00:00')).toBe('0m')
  })
})

// ─── truncate ─────────────────────────────────────────────────────────────────

describe('truncate', () => {
  it('does not truncate strings shorter than n', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('does not truncate strings equal to n', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('truncates strings longer than n with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello w…')
  })

  it('handles empty string', () => {
    expect(truncate('', 5)).toBe('')
  })
})

// ─── getDomainFromEmail ───────────────────────────────────────────────────────

describe('getDomainFromEmail', () => {
  it('extracts the domain from a standard email', () => {
    expect(getDomainFromEmail('user@example.com')).toBe('example.com')
  })

  it('handles subdomains', () => {
    expect(getDomainFromEmail('user@mail.company.io')).toBe('mail.company.io')
  })

  it('returns empty string for malformed input with no @', () => {
    expect(getDomainFromEmail('notanemail')).toBe('')
  })
})

// ─── getPlanLimit ─────────────────────────────────────────────────────────────

describe('getPlanLimit', () => {
  it('returns 3 for free plan', () => {
    expect(getPlanLimit('free')).toBe(3)
  })

  it('returns 20 for starter plan', () => {
    expect(getPlanLimit('starter')).toBe(20)
  })

  it('returns null (unlimited) for pro plan', () => {
    expect(getPlanLimit('pro')).toBeNull()
  })
})

// ─── isOverLimit ─────────────────────────────────────────────────────────────

describe('isOverLimit', () => {
  it('returns false when below free limit', () => {
    expect(isOverLimit('free', 2)).toBe(false)
  })

  it('returns true when at free limit', () => {
    expect(isOverLimit('free', 3)).toBe(true)
  })

  it('returns true when over free limit', () => {
    expect(isOverLimit('free', 5)).toBe(true)
  })

  it('returns false when below starter limit', () => {
    expect(isOverLimit('starter', 19)).toBe(false)
  })

  it('returns true when at starter limit', () => {
    expect(isOverLimit('starter', 20)).toBe(true)
  })

  it('never returns true for pro (unlimited)', () => {
    expect(isOverLimit('pro', 99999)).toBe(false)
  })
})

// ─── isPersonalEmailDomain ───────────────────────────────────────────────────

describe('isPersonalEmailDomain', () => {
  it('returns true for gmail.com', () => {
    expect(isPersonalEmailDomain('gmail.com')).toBe(true)
  })

  it('returns true for yahoo.com', () => {
    expect(isPersonalEmailDomain('yahoo.com')).toBe(true)
  })

  it('returns true for hotmail.com', () => {
    expect(isPersonalEmailDomain('hotmail.com')).toBe(true)
  })

  it('returns true for outlook.com', () => {
    expect(isPersonalEmailDomain('outlook.com')).toBe(true)
  })

  it('returns true for icloud.com', () => {
    expect(isPersonalEmailDomain('icloud.com')).toBe(true)
  })

  it('returns true for protonmail.com', () => {
    expect(isPersonalEmailDomain('protonmail.com')).toBe(true)
  })

  it('returns true for proton.me', () => {
    expect(isPersonalEmailDomain('proton.me')).toBe(true)
  })

  it('returns true for fastmail.com', () => {
    expect(isPersonalEmailDomain('fastmail.com')).toBe(true)
  })

  it('returns false for corporate domain', () => {
    expect(isPersonalEmailDomain('stripe.com')).toBe(false)
  })

  it('returns false for acme.com', () => {
    expect(isPersonalEmailDomain('acme.com')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(isPersonalEmailDomain('GMAIL.COM')).toBe(true)
    expect(isPersonalEmailDomain('Gmail.Com')).toBe(true)
  })
})

import { MeetingCard } from './MeetingCard'
import type { Meeting } from '@/types'

interface MeetingListProps {
  meetings: Meeting[]
}

export function MeetingList({ meetings }: MeetingListProps) {
  if (meetings.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          No meetings yet
        </h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Connect your Google Calendar to automatically import upcoming meetings
          and generate AI-powered briefs.
        </p>
      </div>
    )
  }

  // Group meetings by date
  const grouped = meetings.reduce(
    (acc, meeting) => {
      const date = new Date(meeting.start_time).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
      if (!acc[date]) acc[date] = []
      acc[date].push(meeting)
      return acc
    },
    {} as Record<string, Meeting[]>
  )

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([date, dayMeetings]) => (
        <div key={date}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {date}
          </h2>
          <div className="space-y-3">
            {dayMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

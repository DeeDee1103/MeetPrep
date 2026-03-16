import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatDuration } from '@/lib/utils'
import { GenerateBriefButtonClientComponent } from './GenerateBriefButton'
import type { Meeting } from '@/types'

interface MeetingCardProps {
  meeting: Meeting
}

function getBriefStatusBadge(status: Meeting['brief_status']) {
  switch (status) {
    case 'ready':
      return <Badge variant="success">Brief Ready</Badge>
    case 'generating':
      return <Badge variant="info">Generating...</Badge>
    case 'failed':
      return <Badge variant="danger">Failed</Badge>
    case 'pending':
    default:
      return <Badge variant="default">Pending</Badge>
  }
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {meeting.title}
          </h3>

          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">
              {formatDate(meeting.start_time)}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">
              {formatDuration(meeting.start_time, meeting.end_time)}
            </span>
          </div>

          {meeting.attendees.length > 0 && (
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              <svg
                className="h-4 w-4 text-gray-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
              <span className="text-sm text-gray-500">
                {meeting.attendees
                  .slice(0, 3)
                  .map((a) => a.name ?? a.email)
                  .join(', ')}
                {meeting.attendees.length > 3 &&
                  ` +${meeting.attendees.length - 3} more`}
              </span>
            </div>
          )}

          {meeting.location && (
            <div className="mt-1 flex items-center gap-1">
              <svg
                className="h-4 w-4 text-gray-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
              <span className="text-sm text-gray-500 truncate">
                {meeting.location}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {getBriefStatusBadge(meeting.brief_status)}

          {meeting.brief_status === 'ready' && meeting.brief_id && (
            <Link
              href={`/briefs/${meeting.brief_id}`}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              View Brief →
            </Link>
          )}

          {(meeting.brief_status === 'pending' ||
            meeting.brief_status === 'failed') && (
            <GenerateBriefButtonClientComponent meetingId={meeting.id} />
          )}
        </div>
      </div>

      {meeting.meeting_link && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <a
            href={meeting.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Join meeting →
          </a>
        </div>
      )}
    </div>
  )
}

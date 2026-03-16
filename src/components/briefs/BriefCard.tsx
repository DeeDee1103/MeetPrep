import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { formatDate, truncate } from '@/lib/utils'
import type { Brief, Meeting } from '@/types'

interface BriefCardProps {
  brief: Brief
  meeting: Meeting
}

export function BriefCard({ brief, meeting }: BriefCardProps) {
  return (
    <Link
      href={`/briefs/${brief.id}`}
      className="block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
            {meeting.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(meeting.start_time)}
          </p>
        </div>
        <Badge variant="success">Ready</Badge>
      </div>

      {brief.talking_points.length > 0 && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
          {truncate(brief.talking_points[0], 120)}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <span className="text-xs text-gray-400">
          {brief.agenda.length} agenda items
        </span>
        <span className="text-gray-200">·</span>
        <span className="text-xs text-gray-400">
          {meeting.attendees.length} attendees
        </span>
        {brief.risk_flags.length > 0 && (
          <>
            <span className="text-gray-200">·</span>
            <Badge variant="warning">{brief.risk_flags.length} risk flags</Badge>
          </>
        )}
      </div>
    </Link>
  )
}

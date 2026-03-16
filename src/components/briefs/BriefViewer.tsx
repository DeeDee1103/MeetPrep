import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatDuration } from '@/lib/utils'
import type { Brief, Meeting } from '@/types'

interface BriefViewerProps {
  brief: Brief
  meeting: Meeting
}

export function BriefViewer({ brief, meeting }: BriefViewerProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Meeting header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
            <p className="mt-1 text-gray-500">
              {formatDate(meeting.start_time)} ·{' '}
              {formatDuration(meeting.start_time, meeting.end_time)}
            </p>
            {meeting.location && (
              <p className="mt-1 text-sm text-gray-500">📍 {meeting.location}</p>
            )}
          </div>
          <Badge variant="success">Brief Ready</Badge>
        </div>

        {meeting.meeting_link && (
          <a
            href={meeting.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
            Join meeting
          </a>
        )}

        {meeting.attendees.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Attendees
            </p>
            <div className="flex flex-wrap gap-2">
              {meeting.attendees.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                >
                  {a.name ?? a.email}
                  {a.company && ` · ${a.company}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Company Snapshot */}
      {brief.company_snapshot && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Company Snapshot
          </h2>
          <div className="flex items-start gap-4">
            {brief.company_snapshot.logo_url && (
              <Image
                src={brief.company_snapshot.logo_url}
                alt={brief.company_snapshot.name}
                width={48}
                height={48}
                className="rounded-lg border border-gray-200 flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-900">
                {brief.company_snapshot.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {brief.company_snapshot.industry && (
                  <Badge variant="info">{brief.company_snapshot.industry}</Badge>
                )}
                {brief.company_snapshot.employee_count && (
                  <span className="text-sm text-gray-500">
                    {brief.company_snapshot.employee_count} employees
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {brief.company_snapshot.description}
              </p>
            </div>
          </div>

          {brief.company_snapshot.recent_news.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Recent News
              </p>
              <ul className="space-y-1">
                {brief.company_snapshot.recent_news.map((news, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-gray-400 flex-shrink-0">•</span>
                    {news}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Attendee Summaries */}
      {brief.attendee_summaries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Attendee Profiles
          </h2>
          <div className="space-y-4">
            {brief.attendee_summaries.map((summary, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {summary.name ?? summary.email}
                    </p>
                    {summary.role && (
                      <p className="text-sm text-gray-600">{summary.role}</p>
                    )}
                    {summary.company && (
                      <p className="text-sm text-gray-500">{summary.company}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {summary.email}
                  </span>
                </div>
                {summary.linkedin_summary && (
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {summary.linkedin_summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agenda */}
      {brief.agenda.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Likely Agenda
          </h2>
          <ol className="space-y-3">
            {brief.agenda.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed pt-0.5">
                  {item}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Talking Points */}
      {brief.talking_points.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Talking Points
          </h2>
          <ul className="space-y-3">
            {brief.talking_points.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <p className="text-sm text-gray-700 leading-relaxed">{point}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Icebreakers */}
      {brief.icebreakers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Icebreakers
          </h2>
          <div className="space-y-3">
            {brief.icebreakers.map((ice, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-indigo-50 border-l-4 border-indigo-400"
              >
                <p className="text-sm text-indigo-900 italic">&ldquo;{ice}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Flags */}
      {brief.risk_flags.length > 0 && (
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-yellow-800 uppercase tracking-wide mb-4">
            ⚠️ Risk Flags
          </h2>
          <ul className="space-y-2">
            {brief.risk_flags.map((flag, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-yellow-500" />
                <p className="text-sm text-yellow-800 leading-relaxed">{flag}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-400">
          Generated by MeetPrep ·{' '}
          {new Date(brief.generated_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}

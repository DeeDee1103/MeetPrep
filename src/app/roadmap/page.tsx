import Link from 'next/link'
import { CopyLinkButton } from './CopyButton'
import {
  FEATURES,
  STATUS_CONFIG,
  CATEGORY_CONFIG,
  ALL_STATUSES,
  type Status,
} from '@/lib/roadmap-data'

export const metadata = {
  title: 'Roadmap — MeetPrep',
  description:
    'See what MeetPrep has shipped, what we are building now, and where we are headed.',
}

const PHASE_META: Record<
  Status,
  { heading: string; subheading: string; emoji: string }
> = {
  live: {
    heading: "What's Live",
    subheading: 'Shipped and available to all users today.',
    emoji: '✅',
  },
  'in-progress': {
    heading: 'In Progress',
    subheading: "Being built right now — landing in the next release.",
    emoji: '🔨',
  },
  planned: {
    heading: 'Coming Soon',
    subheading: 'Prioritized and scoped. Shipping in the next 1–2 months.',
    emoji: '🗺️',
  },
  future: {
    heading: 'Future Vision',
    subheading: 'On our long-term radar. Shape it — vote or leave feedback.',
    emoji: '🔭',
  },
}

export default function RoadmapPage() {
  const totalLive = FEATURES.filter((f) => f.status === 'live').length
  const totalBuilding = FEATURES.filter(
    (f) => f.status === 'in-progress' || f.status === 'planned'
  ).length

  return (
    <main className="min-h-screen bg-white">
      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav className="border-b border-gray-100 bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">MeetPrep</span>
          </Link>

          <div className="flex items-center gap-3">
            <CopyLinkButton />
            <Link
              href="/signup"
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-5">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Product Roadmap
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Building the future of{' '}
          <span className="text-indigo-600">meeting prep</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Transparency is core to how we build MeetPrep. Here&apos;s exactly what we&apos;ve
          shipped, what we&apos;re working on, and where we&apos;re heading next.
        </p>

        {/* Summary stats */}
        <div className="inline-flex flex-wrap justify-center gap-6 text-center">
          {[
            { value: totalLive, label: 'Features live today', dot: 'bg-emerald-500' },
            { value: totalBuilding, label: 'In flight right now', dot: 'bg-blue-500' },
            {
              value: FEATURES.filter((f) => f.status === 'future').length,
              label: 'On the horizon',
              dot: 'bg-purple-400',
            },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${stat.dot}`} />
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              <span className="text-sm text-gray-500">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Roadmap phases ────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 space-y-20">
        {ALL_STATUSES.map((status) => {
          const phase = PHASE_META[status]
          const cfg = STATUS_CONFIG[status]
          const phaseFeatures = FEATURES.filter((f) => f.status === status)

          return (
            <div key={status}>
              {/* Phase header */}
              <div className="flex items-start gap-4 mb-8">
                <div
                  className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl flex-shrink-0 ${cfg.bg}`}
                >
                  {phase.emoji}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-gray-900">{phase.heading}</h2>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-gray-500">{phase.subheading}</p>
                </div>
              </div>

              {/* Feature grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {phaseFeatures.map((feature) => {
                  const catCfg = CATEGORY_CONFIG[feature.category]
                  return (
                    <div
                      key={feature.id}
                      className={`rounded-xl border p-5 ${cfg.bg} transition-shadow hover:shadow-md`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-2xl leading-none">{feature.icon}</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${catCfg.color}`}
                        >
                          {catCfg.label}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed mb-3">
                        {feature.description}
                      </p>
                      <details className="group">
                        <summary className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 list-none flex items-center gap-1 select-none">
                          <svg
                            className="h-3 w-3 transition-transform group-open:rotate-180"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                          Details
                        </summary>
                        <p className="mt-2 pt-2 border-t border-black/10 text-xs text-gray-500 leading-relaxed">
                          {feature.detail}
                        </p>
                      </details>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Want to help shape the roadmap?
          </h2>
          <p className="text-indigo-200 mb-8 leading-relaxed">
            We build with our users. Sign up for free and tell us what matters most
            to you — your feedback directly influences what we ship next.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-700 rounded-xl font-semibold text-base hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Get Started Free
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <CopyLinkButton />
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="font-bold text-gray-900">MeetPrep</span>
          </div>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} MeetPrep. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">Home</Link>
            <Link href="/#pricing" className="hover:text-gray-700">Pricing</Link>
            <Link href="/login" className="hover:text-gray-700">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

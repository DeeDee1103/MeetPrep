'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  FEATURES,
  STATUS_CONFIG,
  CATEGORY_CONFIG,
  ALL_STATUSES,
  ALL_CATEGORIES,
  type Status,
  type Category,
} from '@/lib/roadmap-data'

export default function VisionBoardPage() {
  const [selectedStatuses, setSelectedStatuses] = useState<Set<Status>>(new Set(ALL_STATUSES))
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set(ALL_CATEGORIES))
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  function toggleStatus(status: Status) {
    setSelectedStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(status)) {
        if (next.size === 1) return prev
        next.delete(status)
      } else {
        next.add(status)
      }
      return next
    })
  }

  function toggleCategory(category: Category) {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        if (next.size === 1) return prev
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  function resetFilters() {
    setSelectedStatuses(new Set(ALL_STATUSES))
    setSelectedCategories(new Set(ALL_CATEGORIES))
    setSearchQuery('')
  }

  const filteredFeatures = FEATURES.filter((f) => {
    if (!selectedStatuses.has(f.status)) return false
    if (!selectedCategories.has(f.category)) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!f.title.toLowerCase().includes(q) && !f.description.toLowerCase().includes(q)) return false
    }
    return true
  })

  const countByStatus = (status: Status) =>
    FEATURES.filter((f) => f.status === status && selectedCategories.has(f.category)).length

  const isFiltered =
    selectedStatuses.size < ALL_STATUSES.length ||
    selectedCategories.size < ALL_CATEGORIES.length ||
    searchQuery.trim().length > 0

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vision Board</h1>
        <p className="text-gray-500 mt-1">
          Track current features, work in progress, and the product roadmap ahead.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ALL_STATUSES.map((status) => {
          const cfg = STATUS_CONFIG[status]
          const count = FEATURES.filter((f) => f.status === status).length
          return (
            <button
              key={status}
              onClick={() => {
                setSelectedStatuses(new Set([status]))
                setSelectedCategories(new Set(ALL_CATEGORIES))
                setSearchQuery('')
              }}
              className={cn(
                'bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400',
                selectedStatuses.has(status) && selectedStatuses.size === 1
                  ? 'ring-2 ring-indigo-400 border-indigo-300'
                  : 'border-gray-200'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('w-2.5 h-2.5 rounded-full', cfg.dot)} />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {cfg.label}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-xs text-gray-400">features</div>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search features…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Status filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status:</span>
            {ALL_STATUSES.map((status) => {
              const cfg = STATUS_CONFIG[status]
              const active = selectedStatuses.has(status)
              return (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all',
                    active ? cfg.color : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                  )}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', active ? cfg.dot : 'bg-gray-300')} />
                  {cfg.label} ({countByStatus(status)})
                </button>
              )
            })}
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category:</span>
            {ALL_CATEGORIES.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat]
              const active = selectedCategories.has(cat)
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all border',
                    active ? cn(cfg.color, 'border-transparent') : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                  )}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {isFiltered && (
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-700">{filteredFeatures.length}</span> of{' '}
              {FEATURES.length} features
            </p>
            <button
              onClick={resetFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Board columns */}
      {filteredFeatures.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-lg font-medium text-gray-500">No features match your filters</p>
          <button onClick={resetFilters} className="mt-3 text-sm text-indigo-600 hover:underline">
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ALL_STATUSES.map((status) => {
            const cfg = STATUS_CONFIG[status]
            const columnFeatures = filteredFeatures.filter((f) => f.status === status)
            if (columnFeatures.length === 0) return null
            return (
              <div key={status} className="flex flex-col gap-3">
                {/* Column header */}
                <div className="flex items-center gap-2">
                  <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', cfg.dot)} />
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{cfg.label}</h2>
                  <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                    {columnFeatures.length}
                  </span>
                </div>

                {/* Feature cards */}
                {columnFeatures.map((feature) => {
                  const isExpanded = expandedId === feature.id
                  const catCfg = CATEGORY_CONFIG[feature.category]
                  return (
                    <button
                      key={feature.id}
                      onClick={() => setExpandedId(isExpanded ? null : feature.id)}
                      className={cn(
                        'w-full text-left bg-white rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400',
                        isExpanded
                          ? 'border-indigo-300 shadow-md shadow-indigo-50'
                          : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                      )}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="text-2xl leading-none">{feature.icon}</div>
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                              catCfg.color
                            )}
                          >
                            {catCfg.label}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">{feature.title}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>

                        {/* Expand/collapse indicator */}
                        <div
                          className={cn(
                            'mt-3 flex items-center gap-1 text-xs font-medium transition-colors',
                            isExpanded ? 'text-indigo-600' : 'text-gray-400'
                          )}
                        >
                          <svg
                            className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-180')}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                          {isExpanded ? 'Show less' : 'Learn more'}
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-600 leading-relaxed">{feature.detail}</p>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

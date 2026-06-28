import React from 'react'

export function SkeletonLine({ className = '', width = 'w-full', height = 'h-4' }) {
  return <div className={`skeleton ${width} ${height} ${className}`} />
}

export function SkeletonCircle({ size = 'w-10 h-10', className = '' }) {
  return <div className={`skeleton rounded-full ${size} ${className}`} />
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`bg-white dark:bg-dark-card rounded-2xl border border-surface-200/60 dark:border-dark-border p-5 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonCircle />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="w-1/3" height="h-4" />
          <SkeletonLine width="w-1/4" height="h-3" />
        </div>
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine key={i} width={i === lines - 1 ? 'w-2/3' : 'w-full'} height="h-3" />
        ))}
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`bg-white dark:bg-dark-card rounded-2xl border border-surface-200/60 dark:border-dark-border p-5 ${className}`}>
      <div className="space-y-3">
        <div className="flex gap-4 pb-3 border-b border-surface-100 dark:border-dark-border">
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonLine key={i} width="w-1/4" height="h-3" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex gap-4">
            {Array.from({ length: cols }).map((_, col) => (
              <SkeletonLine key={col} width="w-1/4" height="h-3" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-[3px] border-surface-200 dark:border-surface-700" />
          <div className="w-12 h-12 rounded-full border-[3px] border-primary-500 border-t-transparent animate-spin absolute inset-0" />
        </div>
        <p className="text-sm text-surface-400 animate-pulse-soft">Loading MediCore...</p>
      </div>
    </div>
  )
}

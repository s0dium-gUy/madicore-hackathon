import React from 'react'

export default function Card({ children, className = '', hover = false, padding = 'p-5', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-dark-card
        border border-surface-200/60 dark:border-dark-border
        rounded-2xl
        shadow-soft
        ${padding}
        ${hover ? 'hover-lift cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, icon: Icon, count }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <Icon size={20} />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-surface-900 dark:text-surface-100">
            {title}
            {count !== undefined && (
              <span className="ml-2 text-sm font-normal text-surface-400">({count})</span>
            )}
          </h3>
          {subtitle && <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function GlassCard({ children, className = '', padding = 'p-5' }) {
  return (
    <div className={`glass-card ${padding} ${className}`}>
      {children}
    </div>
  )
}

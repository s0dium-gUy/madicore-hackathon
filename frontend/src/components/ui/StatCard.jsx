import React from 'react'

export default function StatCard({ icon: Icon, label, value, trend, color = 'primary', className = '' }) {
  const colorMap = {
    primary: {
      bg: 'bg-primary-50 dark:bg-primary-500/10',
      icon: 'text-primary-600 dark:text-primary-400',
      value: 'text-primary-700 dark:text-primary-300',
    },
    success: {
      bg: 'bg-success-50 dark:bg-success-500/10',
      icon: 'text-success-600 dark:text-success-400',
      value: 'text-success-700 dark:text-success-300',
    },
    warning: {
      bg: 'bg-warning-50 dark:bg-warning-500/10',
      icon: 'text-warning-600 dark:text-warning-400',
      value: 'text-warning-700 dark:text-warning-300',
    },
    info: {
      bg: 'bg-info-50 dark:bg-info-500/10',
      icon: 'text-info-600 dark:text-info-400',
      value: 'text-info-700 dark:text-info-300',
    },
    danger: {
      bg: 'bg-danger-50 dark:bg-danger-500/10',
      icon: 'text-danger-600 dark:text-danger-400',
      value: 'text-danger-700 dark:text-danger-300',
    },
  }

  const c = colorMap[color] || colorMap.primary

  return (
    <div className={`
      bg-white dark:bg-dark-card
      border border-surface-200/60 dark:border-dark-border
      rounded-2xl p-5
      shadow-soft hover-lift
      ${className}
    `}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon size={20} className={c.icon} />
        </div>
        {trend && (
          <span className={`text-xs font-semibold ${
            trend > 0 ? 'text-success-600' : trend < 0 ? 'text-danger-600' : 'text-surface-400'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">{value}</p>
      <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 font-medium">{label}</p>
    </div>
  )
}

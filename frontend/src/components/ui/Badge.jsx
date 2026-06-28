import React from 'react'

const variants = {
  // Doctor statuses
  available: 'bg-success-50 text-success-700 border border-success-200 dark:bg-success-500/10 dark:text-success-500 dark:border-success-500/20',
  on_break: 'bg-warning-50 text-warning-700 border border-warning-200 dark:bg-warning-500/10 dark:text-warning-500 dark:border-warning-500/20',
  unavailable: 'bg-danger-50 text-danger-700 border border-danger-200 dark:bg-danger-500/10 dark:text-danger-500 dark:border-danger-500/20',
  // Queue statuses
  waiting: 'bg-info-50 text-info-700 border border-info-200 dark:bg-info-500/10 dark:text-info-500 dark:border-info-500/20',
  in_consultation: 'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20',
  completed: 'bg-success-50 text-success-700 border border-success-200 dark:bg-success-500/10 dark:text-success-500 dark:border-success-500/20',
  no_show: 'bg-surface-100 text-surface-500 border border-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:border-surface-700',
  // Prescription
  pending_at_pharmacy: 'bg-warning-50 text-warning-700 border border-warning-200 dark:bg-warning-500/10 dark:text-warning-500 dark:border-warning-500/20',
  dispensed: 'bg-success-50 text-success-700 border border-success-200 dark:bg-success-500/10 dark:text-success-500 dark:border-success-500/20',
  // Generic
  default: 'bg-surface-100 text-surface-600 border border-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-700',
  primary: 'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20',
  info: 'bg-info-50 text-info-700 border border-info-200 dark:bg-info-500/10 dark:text-info-500 dark:border-info-500/20',
}

const sizes = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
}

export default function Badge({ children, variant = 'default', size = 'md', dot = false, className = '' }) {
  const variantClass = variants[variant] || variants.default
  const sizeClass = sizes[size] || sizes.md

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full capitalize whitespace-nowrap ${variantClass} ${sizeClass} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'available' || variant === 'completed' || variant === 'dispensed' ? 'bg-success-500' :
          variant === 'on_break' || variant === 'waiting' || variant === 'pending_at_pharmacy' ? 'bg-warning-500' :
          variant === 'unavailable' || variant === 'no_show' ? 'bg-danger-500' :
          variant === 'in_consultation' ? 'bg-primary-500' :
          'bg-surface-400'
        }`} />
      )}
      {children}
    </span>
  )
}

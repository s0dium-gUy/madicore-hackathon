import React from 'react'
import { Inbox, Calendar, FileText, Users } from 'lucide-react'

const illustrations = {
  appointments: Calendar,
  prescriptions: FileText,
  patients: Users,
  default: Inbox,
}

export default function EmptyState({
  title = 'No data found',
  description = 'There is nothing to display here yet.',
  icon = 'default',
  action,
  className = '',
}) {
  const Icon = illustrations[icon] || illustrations.default

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
        <Icon size={28} className="text-surface-400 dark:text-surface-500" />
      </div>
      <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">{title}</h3>
      <p className="text-xs text-surface-400 dark:text-surface-500 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

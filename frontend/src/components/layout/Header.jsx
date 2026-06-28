import React from 'react'
import { Bell, Search } from 'lucide-react'
import Badge from '../ui/Badge'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function getRoleBadgeVariant(role) {
  if (!role) return 'default'
  const r = role.toLowerCase()
  if (r === 'admin' || r === 'hospital admin') return 'primary'
  if (r === 'doctor' || r === 'medical officer') return 'in_consultation'
  if (r === 'patient') return 'info'
  return 'default'
}

export default function Header({ user }) {
  return (
    <header className="flex items-center justify-between mb-8 animate-fade-in">
      {/* Left — Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-50 tracking-tight">
          {getGreeting()}, <span className="bg-gradient-purple-blue bg-clip-text text-transparent">{user.name?.split(' ')[0] || 'User'}</span>
        </h1>
        <p className="text-surface-500 dark:text-surface-400 text-sm mt-1 flex items-center gap-2">
          Have a productive day
          <Badge variant={getRoleBadgeVariant(user.role)} size="sm">{user.role}</Badge>
        </p>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="relative w-10 h-10 rounded-xl bg-white dark:bg-dark-elevated border border-surface-200/60 dark:border-dark-border flex items-center justify-center text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors shadow-soft">
          <Bell size={18} />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-danger-500 rounded-full border-2 border-white dark:border-dark-elevated" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-surface-200 dark:border-dark-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-purple-blue flex items-center justify-center text-white font-semibold text-sm shadow-md">
            {(user.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 leading-tight">{user.name}</p>
            <p className="text-xs text-surface-400">{user.email}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

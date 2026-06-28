import React, { useState } from 'react'
import {
  LayoutDashboard, Users, Calendar, FileText, Settings,
  ChevronLeft, ChevronRight, LogOut, Stethoscope, ClipboardList,
  Sun, Moon, Activity
} from 'lucide-react'

const menuItems = {
  admin: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
  ],
  doctor: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: Stethoscope },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
  ],
  patient: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'book', label: 'Book Slot', icon: ClipboardList },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
  ],
  // Fallback for legacy roles like "Medical Officer", "Hospital Admin"
  default: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
  ],
}

function getRoleKey(role) {
  if (!role) return 'default'
  const r = role.toLowerCase()
  if (r === 'admin' || r === 'hospital admin') return 'admin'
  if (r === 'doctor' || r === 'medical officer') return 'doctor'
  if (r === 'patient') return 'patient'
  return 'default'
}

export default function Sidebar({ role, activeTab, onTabChange, onLogout, darkMode, onToggleDark }) {
  const [collapsed, setCollapsed] = useState(false)
  const roleKey = getRoleKey(role)
  const items = menuItems[roleKey] || menuItems.default

  return (
    <>
      {/* Mobile overlay */}
      <div className={`
        fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden
        transition-opacity duration-300
        ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-0 pointer-events-none'}
      `} />

      <aside className={`
        fixed left-0 top-0 h-screen z-50
        flex flex-col
        bg-white dark:bg-dark-card
        border-r border-surface-200/60 dark:border-dark-border
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-[240px]'}
        shadow-soft-md
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-surface-100 dark:border-dark-border shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-purple-blue flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md">
            M
          </div>
          {!collapsed && (
            <span className="text-lg font-bold bg-gradient-purple-blue bg-clip-text text-transparent truncate animate-fade-in">
              MediCore
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={collapsed ? item.label : undefined}
                className={`
                  w-full flex items-center gap-3 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${collapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2.5'}
                  ${isActive
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 shadow-sm'
                    : 'text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-200'
                  }
                `}
              >
                <Icon size={20} className={`shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-surface-100 dark:border-dark-border space-y-1 shrink-0">
          {/* Dark mode toggle */}
          <button
            onClick={onToggleDark}
            title={darkMode ? 'Light mode' : 'Dark mode'}
            className={`
              w-full flex items-center gap-3 rounded-xl text-sm font-medium px-3 py-2.5
              text-surface-500 dark:text-surface-400
              hover:bg-surface-50 dark:hover:bg-surface-800
              hover:text-surface-900 dark:hover:text-surface-200
              transition-all duration-200
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`
              w-full flex items-center gap-3 rounded-xl text-sm font-medium px-3 py-2.5
              text-surface-500 dark:text-surface-400
              hover:bg-surface-50 dark:hover:bg-surface-800
              hover:text-surface-900 dark:hover:text-surface-200
              transition-all duration-200
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!collapsed && <span>Collapse</span>}
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className={`
              w-full flex items-center gap-3 rounded-xl text-sm font-medium px-3 py-2.5
              text-danger-600 dark:text-danger-400
              hover:bg-danger-50 dark:hover:bg-danger-500/10
              transition-all duration-200
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut size={20} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Spacer to push content right */}
      <div className={`shrink-0 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[240px]'}`} />
    </>
  )
}

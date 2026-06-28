import React from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function DashboardLayout({ user, activeTab, onTabChange, onLogout, darkMode, onToggleDark, children }) {
  return (
    <div className="flex min-h-screen bg-surface-50 dark:bg-surface-950">
      <Sidebar
        role={user.role}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onLogout={onLogout}
        darkMode={darkMode}
        onToggleDark={onToggleDark}
      />
      <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <Header user={user} />
        <div className="animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  )
}

import { useState, useEffect } from 'react'
import * as api from './api'
import { ToastProvider } from './components/ui/Toast'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PatientSignup from './components/PatientSignup'
import OtpVerify from './components/OtpVerify'

// ═════════════════════════════════════════════════════════════
//  App — Thin routing shell with dark mode & auth state
// ═════════════════════════════════════════════════════════════

export default function App() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('welcome') // 'welcome', 'login', 'signup', 'otp'
  const [signupEmail, setSignupEmail] = useState('')
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('medicore-dark-mode')
      if (stored !== null) return stored === 'true'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // Apply dark mode class to <html>
  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('medicore-dark-mode', String(darkMode))
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode(prev => !prev)

  const handleLogout = () => {
    api.logout()
    setUser(null)
    setView('welcome')
  }

  // ── Render ─────────────────────────────────────────
  const renderView = () => {
    if (user) {
      return (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          darkMode={darkMode}
          onToggleDark={toggleDarkMode}
        />
      )
    }

    switch (view) {
      case 'welcome':
        return <Welcome onNavigate={setView} />

      case 'signup':
        return (
          <PatientSignup
            onSignupSuccess={(email) => {
              setSignupEmail(email)
              setView('otp')
            }}
            onNavigate={setView}
          />
        )

      case 'otp':
        return (
          <OtpVerify
            email={signupEmail}
            onVerificationSuccess={(loggedInUser) => {
              setUser(loggedInUser)
            }}
            onNavigate={setView}
          />
        )

      case 'login':
      default:
        return <Login onLogin={setUser} onNavigate={setView} />
    }
  }

  return (
    <ToastProvider>
      {renderView()}
    </ToastProvider>
  )
}

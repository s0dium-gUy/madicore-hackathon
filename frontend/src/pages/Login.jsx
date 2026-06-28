import React, { useState } from 'react'
import { Mail, Lock, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import * as api from '../api'

export default function Login({ onLogin, onNavigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await api.login(email, password)
      onLogin(res.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-surface-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-mesh dark:bg-gradient-dark-mesh" />

      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-purple-blue opacity-[0.03] dark:opacity-[0.06]" />
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-purple-blue flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/20">
              M
            </div>
            <span className="text-2xl font-bold bg-gradient-purple-blue bg-clip-text text-transparent">
              MediCore
            </span>
          </div>
          <h2 className="text-4xl font-bold text-surface-900 dark:text-surface-50 leading-tight mb-4">
            Welcome back to your <span className="bg-gradient-purple-blue bg-clip-text text-transparent">healthcare hub.</span>
          </h2>
          <p className="text-surface-500 dark:text-surface-400 text-base leading-relaxed">
            Manage queues, track appointments, and deliver seamless patient care — all from one dashboard.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { value: '2K+', label: 'Patients' },
              { value: '99%', label: 'Uptime' },
              { value: '<5m', label: 'Wait Time' },
            ].map((s) => (
              <div key={s.label} className="bg-white/60 dark:bg-dark-card/60 backdrop-blur-sm rounded-xl p-4 border border-surface-200/40 dark:border-dark-border">
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{s.value}</p>
                <p className="text-xs text-surface-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <form onSubmit={handleSubmit} className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-purple-blue flex items-center justify-center text-white font-bold text-lg shadow-md">
              M
            </div>
            <span className="text-xl font-bold bg-gradient-purple-blue bg-clip-text text-transparent">
              MediCore
            </span>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-soft-lg border border-surface-200/60 dark:border-dark-border p-8">
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-1">
              Sign In
            </h1>
            <p className="text-surface-500 dark:text-surface-400 text-sm mb-8">
              Enter your credentials to access the dashboard
            </p>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 text-danger-700 dark:text-danger-400 text-sm px-4 py-3 rounded-xl mb-6 animate-slide-down">
                <AlertCircle size={16} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Email */}
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Email</label>
            <div className="relative mb-4">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@madicore.com"
                className="w-full bg-surface-50 dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 input-ring"
              />
            </div>

            {/* Password */}
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Password</label>
            <div className="relative mb-6">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-surface-50 dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 input-ring"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-gradient-purple-blue text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all duration-200 shadow-lg shadow-primary-500/20"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Links */}
            <p className="text-center text-sm text-surface-400 mt-6">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('welcome')}
            className="flex items-center gap-1.5 text-xs text-surface-400 mt-4 mx-auto hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
          >
            <ArrowLeft size={12} />
            Back to Welcome
          </button>
        </form>
      </div>
    </div>
  )
}

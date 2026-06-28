import React from 'react'
import { Zap, Clock, Shield, Activity, ArrowRight } from 'lucide-react'

const features = [
  {
    icon: Clock,
    title: 'Zero Wait Times',
    description: 'Real-time queue tracking eliminates uncertainty and reduces patient wait times significantly.',
  },
  {
    icon: Zap,
    title: 'Instant Booking',
    description: 'Book appointments in seconds with our smart slot allocation system.',
  },
  {
    icon: Shield,
    title: 'Secure Records',
    description: 'Your medical history and prescriptions are protected with enterprise-grade security.',
  },
  {
    icon: Activity,
    title: 'Live Monitoring',
    description: 'Doctors and admins get real-time dashboards with live queue and patient data.',
  },
]

export default function Welcome({ onNavigate }) {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col relative overflow-hidden">
      {/* Background mesh */}
      <div className="absolute inset-0 bg-gradient-mesh dark:bg-gradient-dark-mesh" />
      <div className="absolute top-[-30%] right-[-15%] w-[60%] h-[60%] bg-primary-400/10 dark:bg-primary-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-info-400/10 dark:bg-info-500/5 rounded-full blur-3xl" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-purple-blue flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/20">
            M
          </div>
          <span className="text-xl font-bold bg-gradient-purple-blue bg-clip-text text-transparent">
            MediCore
          </span>
        </div>
        <button
          onClick={() => onNavigate('login')}
          className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          Sign In →
        </button>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-200/60 dark:border-primary-500/20 text-primary-700 dark:text-primary-400 text-xs font-semibold mb-8 animate-fade-in">
            <Activity size={14} />
            Next-gen OPD Management System
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight leading-[1.1] mb-6 animate-fade-in-up text-balance">
            Your Health,{' '}
            <span className="bg-gradient-purple-blue bg-clip-text text-transparent">
              Streamlined.
            </span>
          </h1>

          <p className="text-surface-500 dark:text-surface-400 text-base md:text-lg mb-12 max-w-xl mx-auto animate-fade-in-up leading-relaxed">
            Experience zero wait times, real-time queue tracking, and direct connection to specialized medical professionals.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up">
            <button
              onClick={() => onNavigate('login')}
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-purple-blue text-white rounded-xl font-semibold text-sm md:text-base shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Login to Account
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => onNavigate('signup')}
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white dark:bg-dark-card text-surface-700 dark:text-surface-200 border border-surface-200 dark:border-dark-border rounded-xl font-semibold text-sm md:text-base hover:border-primary-300 dark:hover:border-primary-500/40 hover:text-primary-600 dark:hover:text-primary-400 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-soft"
            >
              Create New Account
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-20 max-w-5xl mx-auto w-full stagger-children">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="group bg-white/70 dark:bg-dark-card/70 backdrop-blur-sm border border-surface-200/50 dark:border-dark-border rounded-2xl p-5 hover-lift"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-3 group-hover:scale-110 transition-transform duration-200">
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-surface-900 dark:text-surface-100 text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">{f.description}</p>
              </div>
            )
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-surface-400 dark:text-surface-600 py-6">
        &copy; {new Date().getFullYear()} MediCore Inc. All rights reserved.
      </footer>
    </div>
  )
}

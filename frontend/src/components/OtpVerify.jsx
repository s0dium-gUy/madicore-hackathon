import React, { useState, useRef, useEffect } from 'react'
import { ShieldCheck, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import * as api from '../api'

export default function OtpVerify({ email, onVerificationSuccess, onNavigate }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const inputRefs = useRef([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpString = otp.join('')
    setError(null)

    if (!/^\d{6}$/.test(otpString)) {
      setError("Please enter a valid 6-digit numeric code.")
      return
    }

    setBusy(true)
    try {
      const res = await api.verifyOtp(email, otpString)
      onVerificationSuccess(res.user)
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

      {/* Left branding panel */}
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
            One last step to <span className="bg-gradient-purple-blue bg-clip-text text-transparent">verify</span> your identity.
          </h2>
          <p className="text-surface-500 dark:text-surface-400 text-base leading-relaxed">
            We've sent a 6-digit code to your email. Enter it below to complete your registration.
          </p>

          {/* Steps */}
          <div className="mt-10 space-y-4">
            {[
              { step: 1, text: 'Fill in your details', done: true },
              { step: 2, text: 'Verify your email with OTP', active: true },
              { step: 3, text: 'Start booking appointments', active: false },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  s.done ? 'bg-success-500 text-white' :
                  s.active ? 'bg-gradient-purple-blue text-white shadow-md shadow-primary-500/20' :
                  'bg-surface-100 dark:bg-surface-800 text-surface-400'
                }`}>
                  {s.done ? '✓' : s.step}
                </div>
                <span className={`text-sm ${s.active ? 'text-surface-900 dark:text-surface-100 font-medium' : s.done ? 'text-success-600 dark:text-success-400 line-through' : 'text-surface-400'}`}>{s.text}</span>
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

          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-soft-lg border border-surface-200/60 dark:border-dark-border p-8 text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mx-auto mb-6 text-primary-600 dark:text-primary-400">
              <ShieldCheck size={32} />
            </div>

            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-1">
              Verify Your Email
            </h1>
            <p className="text-surface-500 dark:text-surface-400 text-sm mb-8">
              Enter the code sent to <span className="font-semibold text-surface-700 dark:text-surface-200">{email}</span>
            </p>

            {error && (
              <div className="flex items-center gap-2.5 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 text-danger-700 dark:text-danger-400 text-sm px-4 py-3 rounded-xl mb-6 animate-slide-down text-left">
                <AlertCircle size={16} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* OTP Input boxes */}
            <div className="flex justify-center gap-2.5 mb-8" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold bg-surface-50 dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-xl text-surface-900 dark:text-surface-100 input-ring"
                />
              ))}
            </div>

            <button
              type="submit" disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-gradient-purple-blue text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all duration-200 shadow-lg shadow-primary-500/20"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Sign In'
              )}
            </button>

            <p className="text-center text-sm text-surface-400 mt-6">
              Didn't receive code?{' '}
              <button type="button" onClick={() => onNavigate('signup')} className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                Try Signing Up Again
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

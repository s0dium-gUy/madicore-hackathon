import React, { useState } from 'react'
import * as api from '../api'

export default function OtpVerify({ email, onVerificationSuccess, onNavigate }) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)

    // Quick regex validation for 6 digits
    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit numeric code.")
      setBusy(false)
      return
    }

    try {
      const res = await api.verifyOtp(email, otp)
      onVerificationSuccess(res.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-tr from-purple-50 via-white to-blue-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-soft-lg p-8 w-full max-w-md border border-gray-100 z-10 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold bg-gradient-purple-blue bg-clip-text text-transparent mb-1">
          Verify Your Email
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          We've sent a 6-digit verification code to <span className="font-semibold text-gray-700">{email}</span>
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl mb-4">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium mb-2 text-left">Enter 6-Digit OTP</label>
        <input
          type="text"
          maxLength={6}
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
          required
          placeholder="000000"
          className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-center text-2xl font-bold tracking-widest mb-6 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-gradient-purple-blue text-white font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition shadow-md shadow-purple-500/20"
        >
          {busy ? 'Verifying…' : 'Verify & Sign In'}
        </button>

        <p className="text-center text-sm text-gray-400 mt-6">
          Didn't receive code?{' '}
          <button
            type="button"
            onClick={() => onNavigate('signup')}
            className="text-purple-600 font-semibold hover:underline"
          >
            Try Signing Up Again
          </button>
        </p>
      </form>
    </div>
  )
}

import React, { useState } from 'react'
import * as api from '../api'

export default function PatientSignup({ onSignupSuccess, onNavigate }) {
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)

    // Regex check on frontend for early error prevention
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email.trim())) {
      setError("Registration failed. Please provide a valid email address format.")
      setBusy(false)
      return
    }

    try {
      await api.patientSignup(fullName, Number(age), gender, email, password)
      onSignupSuccess(email)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-tr from-purple-50 via-white to-blue-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-soft-lg p-8 w-full max-w-md border border-gray-100 z-10">
        <h1 className="text-2xl font-bold bg-gradient-purple-blue bg-clip-text text-transparent mb-1">
          Create Patient Account
        </h1>
        <p className="text-gray-400 text-sm mb-6">Register to track and manage appointments</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl mb-4">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
          placeholder="John Doe"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
        />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <input
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              required
              placeholder="25"
              min="0"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              value={gender}
              onChange={e => setGender(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition bg-white"
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="yourname@example.com"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
        />

        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-gradient-purple-blue text-white font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition shadow-md shadow-purple-500/20"
        >
          {busy ? 'Registering…' : 'Sign Up'}
        </button>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-purple-600 font-semibold hover:underline"
          >
            Sign In
          </button>
        </p>
      </form>
    </div>
  )
}

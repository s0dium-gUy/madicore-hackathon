import React from 'react'

export default function Welcome({ onNavigate }) {
  return (
    <div className="min-h-screen bg-gradient-to-tr from-purple-50 via-white to-blue-50 flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Abstract background shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-300/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300/20 rounded-full blur-3xl"></div>

      <header className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-purple-blue flex items-center justify-center text-white font-bold text-xl shadow-md">
            M
          </div>
          <span className="text-xl font-bold bg-gradient-purple-blue bg-clip-text text-transparent">
            MediCore
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto text-center flex flex-col items-center justify-center my-auto z-10 px-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mb-6 animate-pulse">
          ✨ Next-gen OPD Management System
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-none mb-6">
          Your Health, <br className="md:hidden" />
          <span className="bg-gradient-purple-blue bg-clip-text text-transparent">Streamlined.</span>
        </h1>
        
        <p className="text-gray-500 text-base md:text-lg mb-10 max-w-lg">
          Experience zero wait times, real-time queue tracking, and direct connection to specialized medical professionals.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <button
            onClick={() => onNavigate('login')}
            className="px-8 py-3.5 bg-gradient-purple-blue text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/35 hover:scale-[1.02] transition-all duration-200 text-sm md:text-base"
          >
            Login to Account
          </button>
          <button
            onClick={() => onNavigate('signup')}
            className="px-8 py-3.5 bg-white text-gray-800 border border-gray-200 rounded-xl font-semibold hover:border-purple-400 hover:text-purple-600 hover:scale-[1.02] transition-all duration-200 text-sm md:text-base shadow-sm"
          >
            Create New Account
          </button>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 z-10 mt-auto">
        &copy; {new Date().getFullYear()} MediCore Inc. All rights reserved.
      </footer>
    </div>
  )
}

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const styles = {
  success: 'bg-success-50 border-success-200 text-success-700 dark:bg-success-500/10 dark:border-success-500/20 dark:text-success-400',
  error: 'bg-danger-50 border-danger-200 text-danger-700 dark:bg-danger-500/10 dark:border-danger-500/20 dark:text-danger-400',
  warning: 'bg-warning-50 border-warning-200 text-warning-700 dark:bg-warning-500/10 dark:border-warning-500/20 dark:text-warning-400',
  info: 'bg-info-50 border-info-200 text-info-700 dark:bg-info-500/10 dark:border-info-500/20 dark:text-info-400',
}

function ToastItem({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false)
  const Icon = icons[toast.type] || icons.info

  const handleDismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => onDismiss(toast.id), 300)
  }, [toast.id, onDismiss])

  useEffect(() => {
    const timer = setTimeout(handleDismiss, toast.duration || 4000)
    return () => clearTimeout(timer)
  }, [handleDismiss, toast.duration])

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border shadow-soft-lg
        ${styles[toast.type] || styles.info}
        ${exiting ? 'animate-toast-out' : 'animate-toast-in'}
        max-w-sm w-full
      `}
    >
      <Icon size={18} className="shrink-0" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button onClick={handleDismiss} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Convenience methods
  const toast = useCallback((msg, ok = true) => {
    showToast(msg, ok ? 'success' : 'error')
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

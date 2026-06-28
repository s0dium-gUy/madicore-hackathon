import React, { useState, useEffect } from 'react'
import * as api from '../../api'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import { Calendar, Filter, X, Clock } from 'lucide-react'

export default function AdminSchedule({ toast }) {
  const [appointments, setAppointments] = useState([])
  const [dateFilter, setDateFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSchedule()
  }, [dateFilter])

  const loadSchedule = async () => {
    setLoading(true)
    try {
      const res = await api.getMasterSchedule(dateFilter)
      setAppointments(res.appointments || [])
    } catch (err) {
      toast("Failed to load schedule", false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-8 animate-fade-in-up">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <Calendar size={20} className="text-primary-500" />
          Master Appointment Schedule
          <span className="text-surface-400 font-normal text-sm">({appointments.length})</span>
        </h2>
      </div>

      <Card>
        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-surface-100 dark:border-dark-border">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-surface-400" />
            <label className="text-xs font-medium text-surface-500 dark:text-surface-400">Filter by Date:</label>
          </div>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="bg-surface-50 dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-xl pl-9 pr-4 py-2 text-xs text-surface-900 dark:text-surface-100 input-ring"
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="inline-flex items-center gap-1 text-xs text-surface-400 hover:text-danger-500 transition-colors"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton h-4 w-1/5 rounded" />
                <div className="skeleton h-4 w-1/5 rounded" />
                <div className="skeleton h-4 w-1/5 rounded" />
                <div className="skeleton h-4 w-1/5 rounded" />
                <div className="skeleton h-4 w-1/5 rounded" />
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState
            icon="appointments"
            title="No appointments found"
            description={dateFilter ? `No appointments on ${dateFilter}. Try a different date.` : 'No appointments scheduled yet.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-100 dark:border-dark-border">
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">Date</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">Time Slot</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">Doctor ID</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">Patient ID</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(apt => (
                  <tr key={apt._id} className="border-b border-surface-50 dark:border-dark-border/50 last:border-0 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="py-3.5 font-medium text-surface-900 dark:text-surface-100 text-sm">{apt.date}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-primary-700 dark:text-primary-400 font-semibold text-sm">
                        <Clock size={13} />
                        {apt.timeSlot}
                      </span>
                    </td>
                    <td className="py-3.5 text-surface-600 dark:text-surface-300 text-sm">{apt.doctorId}</td>
                    <td className="py-3.5 text-surface-600 dark:text-surface-300 text-sm">{apt.patientId}</td>
                    <td className="py-3.5">
                      <Badge variant={apt.status === 'booked' ? 'info' : apt.status === 'cancelled' ? 'unavailable' : 'default'} size="sm">
                        {apt.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  )
}

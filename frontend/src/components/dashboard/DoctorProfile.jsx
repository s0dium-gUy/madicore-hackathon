import React, { useState, useEffect, useCallback } from 'react'
import { io } from 'socket.io-client'
import * as api from '../../api'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import { Stethoscope, Clock, Calendar, ChevronDown, Plus, X, Save, Loader2 } from 'lucide-react'

const STATUSES = ['available', 'on_break', 'unavailable']
const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function DoctorProfile({ doctors, user, onRefresh, toast }) {
  const [busy, setBusy] = useState({})
  const [scheduleConfig, setScheduleConfig] = useState([])
  const [editingSchedule, setEditingSchedule] = useState(false)
  const [agenda, setAgenda] = useState([])

  const isDoctor = user.role === 'doctor' || user.role === 'Medical Officer'
  const displayDoctors = isDoctor ? doctors.filter(d => d.id === user.referenceId) : doctors
  const myProfile = displayDoctors[0]

  const fetchAgenda = useCallback(async () => {
    try {
      const res = await api.getDoctorAgenda()
      setAgenda(res.schedule || [])
    } catch (err) {
      toast("Failed to load agenda", false)
    }
  }, [toast])

  // Socket.IO listeners for real-time updates
  useEffect(() => {
    if (isDoctor && myProfile) {
      const token = sessionStorage.getItem('token');
      const socket = io({
        auth: { token },
        transports: ['websocket']
      });

      socket.on('newAppointment', (data) => {
        setAgenda((prevAgenda) => {
          return prevAgenda.map(day => {
            if (day.date === data.date) {
              return {
                ...day,
                slots: day.slots.map(slot => {
                  if (slot.time === data.timeSlot) {
                    return { ...slot, status: 'Booked', patient: data.patient };
                  }
                  return slot;
                })
              };
            }
            return day;
          });
        });
      });

      socket.on('appointmentCancelled', (data) => {
        setAgenda((prevAgenda) => {
          return prevAgenda.map(day => {
            if (day.date === data.date) {
              return {
                ...day,
                slots: day.slots.map(slot => {
                  if (slot.time === data.timeSlot) {
                    return { ...slot, status: 'Available', patient: undefined };
                  }
                  return slot;
                })
              };
            }
            return day;
          });
        });
      });

      return () => {
        socket.off('newAppointment');
        socket.off('appointmentCancelled');
        socket.disconnect();
      };
    }
  }, [isDoctor, myProfile, fetchAgenda]);

  useEffect(() => {
    if (isDoctor && myProfile) {
      if (myProfile.availability) {
        setScheduleConfig(myProfile.availability)
      }
      fetchAgenda()
    }
  }, [myProfile, isDoctor, fetchAgenda])

  const handleStatusChange = async (doctorId, newStatus) => {
    setBusy(prev => ({ ...prev, [doctorId]: true }))
    try {
      await api.updateDoctorStatus(doctorId, newStatus)
      toast(`Status updated to ${newStatus.replace('_', ' ')}`)
      await onRefresh()
    } catch (err) {
      toast(err.message, false)
    } finally {
      setBusy(prev => ({ ...prev, [doctorId]: false }))
    }
  }

  const handleAddSlot = () => {
    setScheduleConfig([...scheduleConfig, { date: new Date().toISOString().split('T')[0], slots: [{ startTime: '09:00', endTime: '17:00', duration: '30' }] }])
  }

  const handleRemoveSlot = (index) => {
    const newConfig = [...scheduleConfig]
    newConfig.splice(index, 1)
    setScheduleConfig(newConfig)
  }

  const handleSlotChange = (index, field, value) => {
    const newConfig = [...scheduleConfig]
    newConfig[index][field] = value
    setScheduleConfig(newConfig)
  }

  const handleTimeChange = (configIndex, slotIndex, field, value) => {
    const newConfig = [...scheduleConfig]
    newConfig[configIndex].slots[slotIndex][field] = value
    setScheduleConfig(newConfig)
  }

  const handleSaveAvailability = async () => {
    setBusy(prev => ({ ...prev, schedSave: true }))
    try {
      await api.updateDoctorAvailability(scheduleConfig)
      toast('Availability schedule updated successfully')
      setEditingSchedule(false)
      await fetchAgenda()
      await onRefresh()
    } catch (err) {
      toast(err.message, false)
    } finally {
      setBusy(prev => ({ ...prev, schedSave: false }))
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year.substring(2)}`;
  }

  return (
    <section className="mb-8 animate-fade-in-up">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <Stethoscope size={20} className="text-primary-500" />
          {isDoctor ? 'My Profile & Settings' : 'Doctors Overview'}
          <span className="text-surface-400 font-normal text-sm">({displayDoctors.length})</span>
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {displayDoctors.map(d => (
          <Card key={d.id} className="animate-slide-up">
            {/* Doctor header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-purple-blue flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {d.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100">{d.name}</h3>
                  <p className="text-surface-400 text-xs">{d.id}</p>
                </div>
              </div>
              <Badge variant={d.status} dot>{d.status.replace('_', ' ')}</Badge>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-surface-500 dark:text-surface-400 bg-surface-50 dark:bg-surface-800 px-2.5 py-1 rounded-lg">
                <Stethoscope size={12} />
                {d.specialization}
              </span>
            </div>

            {/* Doctor-only controls */}
            {isDoctor && (
              <div className="border-t border-surface-100 dark:border-dark-border pt-4 space-y-5">
                {/* Status toggle */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3">Current Status</h4>
                  <div className="flex gap-2 flex-wrap">
                    {STATUSES.map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(d.id, s)}
                        disabled={d.status === s || busy[d.id]}
                        className={`text-xs px-3.5 py-2 rounded-xl border font-medium transition-all duration-200
                          ${d.status === s
                            ? 'border-primary-200 dark:border-primary-500/30 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 shadow-sm cursor-default'
                            : 'border-surface-200 dark:border-dark-border text-surface-500 dark:text-surface-400 hover:border-primary-300 dark:hover:border-primary-500/30 hover:text-primary-600 dark:hover:text-primary-400'
                          } disabled:opacity-40`}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability Schedule */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400">Availability Schedule</h4>
                    <button
                      onClick={() => {
                        if(editingSchedule) setScheduleConfig(d.availability || [])
                        setEditingSchedule(!editingSchedule)
                      }}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      {editingSchedule ? 'Cancel' : 'Edit Schedule'}
                    </button>
                  </div>

                  {editingSchedule ? (
                    <div className="space-y-3">
                      {scheduleConfig.map((config, idx) => (
                        <div key={idx} className="flex flex-wrap items-center gap-2 bg-surface-50 dark:bg-surface-800 p-3 rounded-xl text-xs border border-surface-100 dark:border-dark-border">
                          <input
                            type="date"
                            min={new Date().toLocaleDateString('en-CA')}
                            value={config.date}
                            onChange={e => handleSlotChange(idx, 'date', e.target.value)}
                            className="bg-white dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-lg px-2.5 py-1.5 text-xs input-ring text-surface-900 dark:text-surface-100"
                          />
                          {config.slots && config.slots.map((slot, sIdx) => (
                            <div key={sIdx} className="flex items-center gap-2">
                              <input type="time" value={slot.startTime} onChange={e => handleTimeChange(idx, sIdx, 'startTime', e.target.value)} className="bg-white dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-lg px-2.5 py-1.5 text-xs input-ring text-surface-900 dark:text-surface-100" />
                              <span className="text-surface-400">to</span>
                              <input type="time" value={slot.endTime} onChange={e => handleTimeChange(idx, sIdx, 'endTime', e.target.value)} className="bg-white dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-lg px-2.5 py-1.5 text-xs input-ring text-surface-900 dark:text-surface-100" />
                              <select value={slot.duration} onChange={e => handleTimeChange(idx, sIdx, 'duration', e.target.value)} className="bg-white dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-lg px-2.5 py-1.5 text-xs input-ring text-surface-900 dark:text-surface-100">
                                <option value="15">15m</option>
                                <option value="30">30m</option>
                                <option value="60">60m</option>
                              </select>
                            </div>
                          ))}
                          <button onClick={() => handleRemoveSlot(idx)} className="text-danger-500 hover:text-danger-600 font-bold ml-auto p-1 rounded hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ))}

                      <div className="flex justify-between items-center pt-2">
                        <button onClick={handleAddSlot} className="inline-flex items-center gap-1.5 text-xs bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 px-3 py-2 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors font-medium">
                          <Plus size={14} />
                          Add Date Slot
                        </button>
                        <button onClick={handleSaveAvailability} disabled={busy.schedSave} className="inline-flex items-center gap-1.5 text-xs bg-gradient-purple-blue text-white px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all font-medium shadow-md shadow-primary-500/20">
                          {busy.schedSave ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          {busy.schedSave ? 'Saving...' : 'Save Schedule'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {agenda?.length > 0 ? (
                        agenda.map((dayObj, i) => (
                          <div key={i} className="bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-dark-border rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-surface-100 dark:border-dark-border">
                              <Calendar size={14} className="text-primary-500" />
                              <span className="font-semibold text-sm text-surface-800 dark:text-surface-200">{formatDate(dayObj.date)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {dayObj.slots && dayObj.slots.map(slot => (
                                <div key={slot.time} className={`p-2.5 rounded-xl border transition-all duration-200 ${
                                  slot.status === 'Booked'
                                    ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/20'
                                    : 'bg-white dark:bg-dark-elevated border-surface-200 dark:border-dark-border'
                                }`}>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <Clock size={12} className="text-surface-400" />
                                    <span className="font-semibold text-xs text-surface-800 dark:text-surface-200">{slot.time}</span>
                                  </div>
                                  {slot.status === 'Booked' ? (
                                    <div className="text-xs">
                                      <p className="text-primary-700 dark:text-primary-400 font-medium truncate">{slot.patient?.name}</p>
                                      <p className="text-primary-500/70 dark:text-primary-500/50 text-[10px] mt-0.5">Token: {slot.patient?.tokenNumber || slot.patient?.id}</p>
                                    </div>
                                  ) : (
                                    <p className="text-success-600 dark:text-success-400 text-xs font-medium">Available</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <EmptyState
                          icon="appointments"
                          title="No appointments scheduled"
                          description="Set your availability slots to open bookings."
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </section>
  )
}

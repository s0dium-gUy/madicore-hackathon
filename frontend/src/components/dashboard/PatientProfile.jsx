import React, { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import * as api from '../../api'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import { User, Calendar, Clock, Stethoscope, Loader2, X as XIcon, CalendarPlus, FileText, Plus, Pill, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

// ── Inline Prescription Manager (Doctor → per-patient) ──────
function PatientPrescriptions({ patient, user, toast, onRefresh }) {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRx, setEditingRx] = useState(null)
  const [form, setForm] = useState({ prescriptionId: '', medication: '' })
  const [busy, setBusy] = useState(false)

  const fetchPrescriptions = async () => {
    try {
      const res = await api.getDoctorPatientPrescriptions(patient.id)
      setPrescriptions(Array.isArray(res) ? res : [])
    } catch (err) {
      toast('Failed to load prescriptions', false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrescriptions()
  }, [patient.id])

  useEffect(() => {
    if (editingRx) {
      setForm({ prescriptionId: editingRx.prescriptionId, medication: editingRx.medication })
      setShowForm(true)
    } else {
      setForm({ prescriptionId: '', medication: '' })
    }
  }, [editingRx])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (editingRx) {
        await api.updatePrescription(editingRx._id, form.medication)
        toast('Prescription updated')
      } else {
        await api.createPrescription(form.prescriptionId, patient.id, form.medication)
        toast('Prescription created')
      }
      setForm({ prescriptionId: '', medication: '' })
      setEditingRx(null)
      setShowForm(false)
      await fetchPrescriptions()
      await onRefresh()
    } catch (err) {
      toast(err.message, false)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (rx) => {
    if (!window.confirm("Are you sure you want to delete this prescription?")) return
    try {
      setPrescriptions(prev => prev.filter(item => item._id !== rx._id))
      await api.deletePrescription(rx._id)
      toast('Prescription deleted')
      await fetchPrescriptions()
      await onRefresh()
    } catch (err) {
      toast(err.message, false)
      await fetchPrescriptions()
    }
  }

  return (
    <div className="border-t border-surface-100 dark:border-dark-border pt-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 flex items-center gap-2">
          <FileText size={14} />
          Prescriptions for {patient.name}
          <span className="text-surface-300 font-normal normal-case">({prescriptions.length})</span>
        </h4>
        <button
          onClick={() => {
            if (showForm) {
              setEditingRx(null)
              setShowForm(false)
            } else {
              setShowForm(true)
            }
          }}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all duration-200 ${
            showForm
              ? 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200'
              : 'bg-gradient-purple-blue text-white hover:opacity-90 shadow-md shadow-primary-500/20'
          }`}
        >
          {showForm ? 'Cancel' : <><Plus size={12} /> Add Prescription</>}
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-primary-50/50 dark:bg-primary-500/5 border border-primary-200/40 dark:border-primary-500/10 rounded-xl p-4 mb-4 animate-slide-down">
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 text-xs text-primary-700 dark:text-primary-300 font-semibold bg-primary-100/50 dark:bg-primary-500/10 p-2.5 rounded-xl border border-primary-200 dark:border-primary-500/20">
              {editingRx
                ? `Editing: ${editingRx.prescriptionId}`
                : <>Prescription for: <span className="text-primary-900 dark:text-primary-200 font-bold">{patient.name} ({patient.id})</span></>
              }
            </div>

            {!editingRx && (
              <div>
                <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">Prescription ID</label>
                <input
                  type="text"
                  placeholder="e.g. RX-100"
                  required
                  value={form.prescriptionId}
                  onChange={e => setForm(f => ({ ...f, prescriptionId: e.target.value }))}
                  className="w-full bg-white dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-xl px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 input-ring"
                />
              </div>
            )}

            <div className={editingRx ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">Medication</label>
              <div className="relative">
                <Pill size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  type="text"
                  placeholder="e.g. Amoxicillin 250mg"
                  required
                  value={form.medication}
                  onChange={e => setForm(f => ({ ...f, medication: e.target.value }))}
                  className="w-full bg-white dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 input-ring"
                />
              </div>
            </div>

            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 bg-gradient-purple-blue text-white font-semibold text-sm px-5 py-2 rounded-xl hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md shadow-primary-500/20"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : editingRx ? <Edit2 size={14} /> : <Plus size={14} />}
                {busy ? 'Saving...' : editingRx ? 'Update' : 'Create'}
              </button>
              {editingRx && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRx(null)
                    setShowForm(false)
                  }}
                  className="bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200 font-semibold text-sm px-5 py-2 rounded-xl hover:bg-surface-300 dark:hover:bg-surface-600 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Prescription list */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-primary-500 py-3">
          <Loader2 size={14} className="animate-spin" />
          Loading prescriptions...
        </div>
      ) : prescriptions.length > 0 ? (
        <div className="space-y-2">
          {prescriptions.map(rx => (
            <div key={rx._id || rx.prescriptionId} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-100 dark:border-dark-border group hover:border-primary-200 dark:hover:border-primary-500/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-warning-50 dark:bg-warning-500/10 flex items-center justify-center text-warning-600 dark:text-warning-400">
                  <Pill size={14} />
                </div>
                <div>
                  <p className="font-semibold text-surface-900 dark:text-surface-100 text-sm">{rx.medication}</p>
                  <p className="text-surface-400 text-xs mt-0.5">{rx.prescriptionId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={rx.status?.replace(/ /g, '_') || 'pending_at_pharmacy'} size="sm">
                  {(rx.status || '').replace(/_/g, ' ')}
                </Badge>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingRx(rx)}
                    className="text-xs bg-surface-100 dark:bg-surface-700 hover:bg-primary-100 dark:hover:bg-primary-500/20 hover:text-primary-600 dark:hover:text-primary-400 text-surface-600 dark:text-surface-300 p-1.5 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(rx)}
                    className="text-xs bg-surface-100 dark:bg-surface-700 hover:bg-danger-100 dark:hover:bg-danger-500/20 hover:text-danger-600 dark:hover:text-danger-400 text-surface-600 dark:text-surface-300 p-1.5 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-surface-400 text-xs">No prescriptions for this patient yet.</p>
        </div>
      )}
    </div>
  )
}

// ── Main PatientProfile Component ───────────────────────────
export default function PatientProfile({ patients, doctors, appointments, user, onRefresh, toast }) {
  const [bookingState, setBookingState] = useState({})
  const [busy, setBusy] = useState({})
  const [expandedPatientId, setExpandedPatientId] = useState(null)

  const isPatient = user.role === 'patient'
  const isDoctor = user.role === 'doctor' || user.role === 'Medical Officer'
  const displayPatients = isPatient ? patients.filter(p => p.id === user.referenceId) : patients

  // Socket.IO for real-time cancellation notifications
  useEffect(() => {
    if (isPatient) {
      const token = sessionStorage.getItem('token');
      const socket = io({
        auth: { token },
        transports: ['websocket']
      });

      socket.on('appointmentCancelledByDoctor', (data) => {
        toast(`Alert: Your appointment on ${data.date} at ${data.timeSlot} was cancelled by the doctor.`, false);
        onRefresh();
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isPatient, user.referenceId, onRefresh, toast]);

  if (displayPatients.length === 0) return null

  const handleDateChange = async (patientId, doctorId, date) => {
    if (!doctorId || !date) return
    setBookingState(prev => ({
      ...prev,
      [patientId]: { ...prev[patientId], date, loadingSlots: true }
    }))
    try {
      const res = await api.getAvailableSlots(doctorId, date)
      setBookingState(prev => ({
        ...prev,
        [patientId]: { ...prev[patientId], slots: res.availableSlots, loadingSlots: false }
      }))
    } catch (err) {
      toast("Failed to load slots", false)
      setBookingState(prev => ({
        ...prev,
        [patientId]: { ...prev[patientId], slots: [], loadingSlots: false }
      }))
    }
  }

  const handleBookSlot = async (patientId) => {
    const state = bookingState[patientId]
    if (!state?.doctorId || !state?.date || !state?.selectedSlot) return

    setBusy(prev => ({ ...prev, [patientId]: true }))
    try {
      await api.bookAppointment(state.doctorId, state.date, state.selectedSlot)
      toast(`Successfully booked for ${state.date} at ${state.selectedSlot}`)
      setBookingState(prev => ({ ...prev, [patientId]: undefined }))
      await onRefresh()
    } catch (err) {
      toast(err.message, false)
    } finally {
      setBusy(prev => ({ ...prev, [patientId]: false }))
    }
  }

  const togglePatient = (patientId) => {
    setExpandedPatientId(prev => prev === patientId ? null : patientId)
  }

  return (
    <section className="mb-8 animate-fade-in-up">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <User size={20} className="text-primary-500" />
          {isPatient ? 'My Profile' : 'Patients'}
          <span className="text-surface-400 font-normal text-sm">({displayPatients.length})</span>
        </h2>
      </div>

      <div className="grid gap-4">
        {displayPatients.map(p => {
          const bState = bookingState[p.id] || {}
          const isExpanded = expandedPatientId === p.id

          return (
            <Card key={p.id}>
              {/* Patient header */}
              <div
                className={`flex items-center justify-between ${isDoctor ? 'cursor-pointer' : ''}`}
                onClick={() => isDoctor && togglePatient(p.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-info-50 dark:bg-info-500/10 flex items-center justify-center text-info-600 dark:text-info-400 font-bold text-sm">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-surface-100">{p.name}</h3>
                    <span className="text-surface-400 text-xs">{p.id}</span>
                  </div>
                </div>
                {isDoctor && (
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${isExpanded ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400' : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300'}`}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                )}
              </div>

              {/* Doctor's expanded view: per-patient prescriptions */}
              {isDoctor && isExpanded && (
                <PatientPrescriptions
                  patient={p}
                  user={user}
                  toast={toast}
                  onRefresh={onRefresh}
                />
              )}

              {/* Patient's own view: appointments + booking */}
              {isPatient && (
                <div className="border-t border-surface-100 dark:border-dark-border pt-5 space-y-6 mt-4">

                  {/* Active Appointments */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3 flex items-center gap-2">
                      <Calendar size={14} />
                      My Active Appointments
                    </h4>
                    {appointments.filter(a => a.patientId === user.referenceId).length > 0 ? (
                      <div className="space-y-2">
                        {appointments.filter(a => a.patientId === user.referenceId).map(apt => (
                          <div key={apt.appointmentId} className="flex items-center justify-between p-3.5 bg-primary-50 dark:bg-primary-500/10 rounded-xl border border-primary-200/60 dark:border-primary-500/20 group hover:border-primary-300 dark:hover:border-primary-500/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                <Clock size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-primary-900 dark:text-primary-200">{apt.date} at {apt.timeSlot}</p>
                                <p className="text-xs text-primary-600/70 dark:text-primary-400/60 mt-0.5">Doctor ID: {apt.doctorId}</p>
                              </div>
                            </div>
                            <button
                              disabled={busy[apt.appointmentId]}
                              onClick={async () => {
                                setBusy(prev => ({ ...prev, [apt.appointmentId]: true }))
                                try {
                                  await api.cancelAppointment(apt.appointmentId)
                                  toast('Appointment cancelled successfully.')
                                  await onRefresh()
                                } catch (err) {
                                  toast(err.response?.data?.error || err.message, false)
                                } finally {
                                  setBusy(prev => ({ ...prev, [apt.appointmentId]: false }))
                                }
                              }}
                              className="inline-flex items-center gap-1.5 text-xs bg-white dark:bg-dark-card text-danger-600 dark:text-danger-400 border border-danger-200 dark:border-danger-500/20 px-3 py-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-500/10 disabled:opacity-50 transition-all font-medium"
                            >
                              {busy[apt.appointmentId] ? <Loader2 size={12} className="animate-spin" /> : <XIcon size={12} />}
                              {busy[apt.appointmentId] ? 'Cancelling...' : 'Cancel'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon="appointments"
                        title="No upcoming appointments"
                        description="Book a new appointment below."
                      />
                    )}
                  </div>

                  {/* Book New Appointment */}
                  <div className="border-t border-surface-100 dark:border-dark-border pt-5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-4 flex items-center gap-2">
                      <CalendarPlus size={14} />
                      Book New Appointment
                    </h4>

                    <div className="grid sm:grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">Select Doctor</label>
                        <div className="relative">
                          <Stethoscope size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                          <select
                            value={bState.doctorId || ''}
                            onChange={e => setBookingState(prev => ({ ...prev, [p.id]: { doctorId: e.target.value, date: '', slots: [] } }))}
                            className="w-full bg-surface-50 dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 input-ring appearance-none"
                          >
                            <option value="">Choose a Doctor...</option>
                            {doctors.map(d => (
                              <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">Select Date</label>
                        <div className="relative">
                          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                          <input
                            type="date"
                            min={new Date().toLocaleDateString('en-CA')}
                            disabled={!bState.doctorId}
                            value={bState.date || ''}
                            onChange={e => handleDateChange(p.id, bState.doctorId, e.target.value)}
                            className="w-full bg-surface-50 dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 input-ring disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    {bState.date && (
                      <div className="mt-4 animate-slide-up">
                        <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-2">Available Slots</label>
                        {bState.loadingSlots ? (
                          <div className="flex items-center gap-2 text-xs text-primary-500 py-2">
                            <Loader2 size={14} className="animate-spin" />
                            Loading available slots...
                          </div>
                        ) : bState.slots && bState.slots.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {bState.slots.map(slot => (
                              <button
                                key={slot}
                                onClick={() => setBookingState(prev => ({ ...prev, [p.id]: { ...bState, selectedSlot: slot } }))}
                                className={`text-xs font-medium px-3.5 py-2 rounded-xl border transition-all duration-200 ${
                                  bState.selectedSlot === slot
                                    ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20'
                                    : 'bg-white dark:bg-dark-elevated text-surface-600 dark:text-surface-300 border-surface-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-500/30 hover:text-primary-600 dark:hover:text-primary-400'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-danger-500">No slots available on this date. Please choose another.</p>
                        )}
                      </div>
                    )}

                    {bState.selectedSlot && (
                      <div className="mt-4 animate-slide-up">
                        <button
                          onClick={() => handleBookSlot(p.id)}
                          disabled={busy[p.id]}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-purple-blue text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all duration-200 shadow-lg shadow-primary-500/20"
                        >
                          {busy[p.id] ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Confirming...
                            </>
                          ) : (
                            <>
                              <CalendarPlus size={14} />
                              Confirm Booking for {bState.selectedSlot}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </section>
  )
}

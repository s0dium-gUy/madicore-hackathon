import { useState, useEffect, useCallback } from 'react'
import * as api from './api'

// ── Color Maps ──────────────────────────────────────────────
const STATUS_COLORS = {
  available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  on_break: 'bg-amber-100 text-amber-700 border-amber-200',
  unavailable: 'bg-red-100 text-red-700 border-red-200',
}

const QUEUE_COLORS = {
  waiting: 'bg-blue-100 text-blue-700',
  in_consultation: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  no_show: 'bg-gray-200 text-gray-500',
}

const STATUSES = ['available', 'on_break', 'unavailable']
const QUEUE_STATUSES = ['waiting', 'in_consultation', 'completed', 'no_show']

// ═════════════════════════════════════════════════════════════
//  App — Top-level router between Login and Dashboard
// ═════════════════════════════════════════════════════════════

export default function App() {
  const [user, setUser] = useState(null)

  if (!user) return <LoginPage onLogin={setUser} />
  return <Dashboard user={user} onLogout={() => setUser(null)} />
}

// ═════════════════════════════════════════════════════════════
//  LOGIN PAGE
// ═════════════════════════════════════════════════════════════

function LoginPage({ onLogin }) {
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-card-bg rounded-2xl shadow-soft-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold bg-gradient-purple-blue bg-clip-text text-transparent mb-1">
          Madicore Hospital
        </h1>
        <p className="text-text-muted text-sm mb-6">Sign in to access the dashboard</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl mb-4">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)} required
          placeholder="doctor@madicore.com"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
        />

        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)} required
          placeholder="••••••••"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
        />

        <button
          type="submit" disabled={busy}
          className="w-full bg-gradient-purple-blue text-white font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition"
        >
          {busy ? 'Signing in…' : 'Sign In'}
        </button>

        <p className="text-xs text-text-muted text-center mt-4">
          Try <b>doctor@madicore.com</b> / <b>madicore123</b>
        </p>
      </form>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
//  DASHBOARD
// ═════════════════════════════════════════════════════════════

function Dashboard({ user, onLogout }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const res = await api.getHospitalData()
      setData(res)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  if (loading) return <Loader />
  if (error) return <ErrorScreen msg={error} retry={refresh} />

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-10">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-soft-lg text-sm font-medium transition-all
          ${toast.ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-purple-blue bg-clip-text text-transparent">
            Madicore Hospital
          </h1>
          <p className="text-text-muted text-sm mt-0.5">
            Welcome, <span className="font-medium text-text-dark">{user.name}</span> · {user.role}
          </p>
        </div>
        <button onClick={onLogout} className="text-sm text-text-muted hover:text-red-500 transition font-medium">
          Sign Out
        </button>
      </header>

      {/* Doctors Section */}
      <DoctorsSection doctors={data.doctors} onRefresh={refresh} toast={showToast} />

      {/* Patients Section */}
      <PatientsSection
        patients={data.patients}
        doctors={data.doctors}
        onRefresh={refresh}
        toast={showToast}
      />

      {/* Prescriptions Section */}
      <PrescriptionsSection
        prescriptions={data.currentPrescriptions}
        patients={data.patients}
        doctors={data.doctors}
        onRefresh={refresh}
        toast={showToast}
      />
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
//  DOCTORS SECTION
// ═════════════════════════════════════════════════════════════

function DoctorsSection({ doctors, onRefresh, toast }) {
  const [expandedId, setExpandedId] = useState(null)
  const [queueData, setQueueData] = useState({})
  const [editSchedule, setEditSchedule] = useState({})
  const [busy, setBusy] = useState({})

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    try {
      const q = await api.getDoctorQueue(id)
      setQueueData(prev => ({ ...prev, [id]: q }))
    } catch {}
  }

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

  const handleScheduleSave = async (doctorId) => {
    const schedule = editSchedule[doctorId]
    if (!schedule) return
    setBusy(prev => ({ ...prev, [`sched-${doctorId}`]: true }))
    try {
      await api.updateDoctorAvailability(doctorId, schedule)
      toast('Schedule updated')
      setEditSchedule(prev => ({ ...prev, [doctorId]: undefined }))
      await onRefresh()
    } catch (err) {
      toast(err.message, false)
    } finally {
      setBusy(prev => ({ ...prev, [`sched-${doctorId}`]: false }))
    }
  }

  return (
    <Section title="Doctors" count={doctors.length}>
      <div className="grid gap-4 sm:grid-cols-2">
        {doctors.map(d => (
          <div key={d.id} className="bg-card-bg rounded-2xl p-5 shadow-soft">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{d.name}</h3>
                <p className="text-text-muted text-xs">{d.id}</p>
              </div>
              <Badge className={STATUS_COLORS[d.status]}>{d.status.replace('_', ' ')}</Badge>
            </div>

            <p className="text-text-muted text-sm">{d.specialization}</p>
            <p className="text-text-muted text-sm mt-1">Schedule: {d.availabilitySchedule}</p>
            <p className="text-sm mt-1">
              Patients in queue: <span className="font-semibold">{d.currentPatientCount}</span>
            </p>

            {/* Status Buttons */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(d.id, s)}
                  disabled={d.status === s || busy[d.id]}
                  className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition
                    ${d.status === s
                      ? STATUS_COLORS[s] + ' cursor-default'
                      : 'border-gray-200 text-text-muted hover:border-gray-400'
                    } disabled:opacity-40`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Schedule Edit */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                placeholder={d.availabilitySchedule}
                value={editSchedule[d.id] || ''}
                onChange={e => setEditSchedule(prev => ({ ...prev, [d.id]: e.target.value }))}
                className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <button
                onClick={() => handleScheduleSave(d.id)}
                disabled={!editSchedule[d.id] || busy[`sched-${d.id}`]}
                className="text-xs bg-gradient-purple-blue text-white px-3 py-1.5 rounded-xl font-medium hover:opacity-90 disabled:opacity-40 transition"
              >
                Save
              </button>
            </div>

            {/* Queue Toggle */}
            <button
              onClick={() => toggleExpand(d.id)}
              className="text-xs text-purple-600 hover:text-purple-800 mt-3 font-medium transition"
            >
              {expandedId === d.id ? '▾ Hide Queue' : '▸ View Queue'}
            </button>

            {expandedId === d.id && queueData[d.id] && (
              <div className="mt-2 border-t border-gray-100 pt-2">
                {queueData[d.id].length === 0 ? (
                  <p className="text-xs text-text-muted">No patients in queue</p>
                ) : (
                  queueData[d.id].map((p, i) => (
                    <div key={p.id} className="text-xs py-1 flex justify-between">
                      <span>{i + 1}. {p.name} ({p.tokenNumber})</span>
                      <Badge className={QUEUE_COLORS[p.queueStatus]}>{p.queueStatus.replace('_', ' ')}</Badge>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  )
}

// ═════════════════════════════════════════════════════════════
//  PATIENTS SECTION
// ═════════════════════════════════════════════════════════════

function PatientsSection({ patients, doctors, onRefresh, toast }) {
  const [expandedId, setExpandedId] = useState(null)
  const [historyData, setHistoryData] = useState({})
  const [bookForm, setBookForm] = useState({})
  const [busy, setBusy] = useState({})

  const toggleHistory = async (id) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    try {
      const h = await api.getPatientHistory(id)
      setHistoryData(prev => ({ ...prev, [id]: h }))
    } catch {}
  }

  const handleQueueUpdate = async (patientId, queueStatus) => {
    setBusy(prev => ({ ...prev, [`q-${patientId}`]: true }))
    try {
      await api.updateQueueStatus(patientId, queueStatus)
      toast(`Queue → ${queueStatus.replace('_', ' ')}`)
      await onRefresh()
    } catch (err) {
      toast(err.message, false)
    } finally {
      setBusy(prev => ({ ...prev, [`q-${patientId}`]: false }))
    }
  }

  const handleComplete = async (patientId) => {
    setBusy(prev => ({ ...prev, [`c-${patientId}`]: true }))
    try {
      await api.markComplete(patientId)
      toast('Appointment marked complete')
      await onRefresh()
    } catch (err) {
      toast(err.message, false)
    } finally {
      setBusy(prev => ({ ...prev, [`c-${patientId}`]: false }))
    }
  }

  const handleFastTrack = async (patientId) => {
    setBusy(prev => ({ ...prev, [`ft-${patientId}`]: true }))
    try {
      const res = await api.fastTrack(patientId)
      toast(`Fast-tracked → ${res.doctor?.name || 'assigned'}`)
      await onRefresh()
    } catch (err) {
      toast(err.message, false)
    } finally {
      setBusy(prev => ({ ...prev, [`ft-${patientId}`]: false }))
    }
  }

  const handleBookSlot = async (patientId) => {
    const form = bookForm[patientId]
    if (!form?.doctorId || !form?.timeSlot) return
    setBusy(prev => ({ ...prev, [`b-${patientId}`]: true }))
    try {
      await api.bookSlot(patientId, form.doctorId, form.timeSlot)
      toast('Slot booked successfully')
      setBookForm(prev => ({ ...prev, [patientId]: undefined }))
      await onRefresh()
    } catch (err) {
      toast(err.message, false)
    } finally {
      setBusy(prev => ({ ...prev, [`b-${patientId}`]: false }))
    }
  }

  return (
    <Section title="Patient Queue" count={patients.length}>
      <div className="grid gap-4">
        {patients.map(p => {
          const form = bookForm[p.id] || {}
          const assignedDoc = doctors.find(d => d.id === p.assignedDoctorId)
          return (
            <div key={p.id} className="bg-card-bg rounded-2xl p-5 shadow-soft">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="bg-gradient-purple-blue text-white text-xs font-bold px-3 py-1 rounded-pill">
                    {p.tokenNumber}
                  </span>
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <span className="text-text-muted text-xs">{p.id}</span>
                  </div>
                </div>
                <Badge className={QUEUE_COLORS[p.queueStatus]}>{p.queueStatus.replace('_', ' ')}</Badge>
              </div>

              {/* Vitals */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-text-muted mt-3">
                <Stat label="Age" value={p.age} />
                <Stat label="Blood" value={p.bloodGroup} />
                <Stat label="BP" value={p.bp} />
                <Stat label="Temp" value={p.temp} />
              </div>

              {/* Assignment */}
              <p className="text-sm text-text-muted mt-2">
                Slot: <span className="font-medium text-text-dark">{p.bookedTimeSlot}</span>
                {' · '}Doctor: <span className="font-medium text-text-dark">
                  {assignedDoc ? assignedDoc.name : p.assignedDoctorId}
                </span>
              </p>

              {/* Queue Status Buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                {QUEUE_STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => handleQueueUpdate(p.id, s)}
                    disabled={p.queueStatus === s || busy[`q-${p.id}`]}
                    className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition
                      ${p.queueStatus === s
                        ? QUEUE_COLORS[s] + ' border-transparent cursor-default'
                        : 'border-gray-200 text-text-muted hover:border-gray-400'
                      } disabled:opacity-40`}
                  >
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => handleComplete(p.id)}
                  disabled={p.queueStatus === 'completed' || busy[`c-${p.id}`]}
                  className="text-xs bg-emerald-500 text-white px-4 py-1.5 rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-40 transition"
                >
                  ✓ Mark Complete
                </button>
                <button
                  onClick={() => handleFastTrack(p.id)}
                  disabled={busy[`ft-${p.id}`]}
                  className="text-xs bg-gradient-purple-blue text-white px-4 py-1.5 rounded-xl font-medium hover:opacity-90 disabled:opacity-40 transition"
                >
                  ⚡ Fast Track
                </button>
                <button
                  onClick={() => toggleHistory(p.id)}
                  className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1.5 font-medium transition"
                >
                  {expandedId === p.id ? '▾ Hide History' : '▸ Medical History'}
                </button>
              </div>

              {/* Book Slot Form */}
              <div className="flex gap-2 mt-3 flex-wrap">
                <select
                  value={form.doctorId || ''}
                  onChange={e => setBookForm(prev => ({ ...prev, [p.id]: { ...form, doctorId: e.target.value } }))}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.status.replace('_', ' ')})</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Time slot (e.g. 14:00-14:15)"
                  value={form.timeSlot || ''}
                  onChange={e => setBookForm(prev => ({ ...prev, [p.id]: { ...form, timeSlot: e.target.value } }))}
                  className="flex-1 min-w-[140px] text-xs border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <button
                  onClick={() => handleBookSlot(p.id)}
                  disabled={!form.doctorId || !form.timeSlot || busy[`b-${p.id}`]}
                  className="text-xs bg-blue-500 text-white px-4 py-1.5 rounded-xl font-medium hover:bg-blue-600 disabled:opacity-40 transition"
                >
                  Book Slot
                </button>
              </div>

              {/* Medical History Expansion */}
              {expandedId === p.id && historyData[p.id] && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <h4 className="text-sm font-semibold mb-2">Past Records</h4>
                  {historyData[p.id].pastRecords.length === 0 ? (
                    <p className="text-xs text-text-muted">No past records</p>
                  ) : (
                    historyData[p.id].pastRecords.map((r, i) => (
                      <div key={i} className="text-xs mb-1.5 bg-gray-50 rounded-lg px-3 py-2">
                        <span className="font-medium">{r.date}</span> — {r.diagnosis}
                        {r.notes && <span className="text-text-muted"> ({r.notes})</span>}
                      </div>
                    ))
                  )}
                  <h4 className="text-sm font-semibold mt-3 mb-2">Current Prescriptions</h4>
                  {historyData[p.id].currentPrescriptions.length === 0 ? (
                    <p className="text-xs text-text-muted">No prescriptions</p>
                  ) : (
                    historyData[p.id].currentPrescriptions.map((rx, i) => (
                      <div key={i} className="text-xs mb-1.5 bg-gray-50 rounded-lg px-3 py-2 flex justify-between">
                        <span>{rx.medication} <span className="text-text-muted">({rx.prescriptionId})</span></span>
                        <Badge className="bg-amber-100 text-amber-700">{(rx.status || '').replace(/_/g, ' ')}</Badge>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// ═════════════════════════════════════════════════════════════
//  PRESCRIPTIONS SECTION
// ═════════════════════════════════════════════════════════════

function PrescriptionsSection({ prescriptions, patients, doctors, onRefresh, toast }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ patientId: '', prescriptionId: '', medication: '', issuedBy: '' })
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.createPrescription(form.patientId, form.prescriptionId, form.medication, form.issuedBy)
      toast('Prescription created')
      setForm({ patientId: '', prescriptionId: '', medication: '', issuedBy: '' })
      setShowForm(false)
      await onRefresh()
    } catch (err) {
      toast(err.message, false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section
      title="Prescriptions"
      count={prescriptions.length}
      action={
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs bg-gradient-purple-blue text-white px-4 py-1.5 rounded-xl font-medium hover:opacity-90 transition"
        >
          {showForm ? 'Cancel' : '+ New Prescription'}
        </button>
      }
    >
      {/* New Prescription Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-purple-50 rounded-xl p-4 mb-4 grid gap-3 sm:grid-cols-2">
          <select
            value={form.patientId} required
            onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            <option value="">Patient</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
          </select>

          <select
            value={form.issuedBy} required
            onChange={e => setForm(f => ({ ...f, issuedBy: e.target.value }))}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            <option value="">Issuing Doctor</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <input
            type="text" placeholder="Prescription ID (e.g. RX-100)" required
            value={form.prescriptionId}
            onChange={e => setForm(f => ({ ...f, prescriptionId: e.target.value }))}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />

          <input
            type="text" placeholder="Medication (e.g. Amoxicillin 250mg)" required
            value={form.medication}
            onChange={e => setForm(f => ({ ...f, medication: e.target.value }))}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />

          <div className="sm:col-span-2">
            <button
              type="submit" disabled={busy}
              className="bg-gradient-purple-blue text-white font-semibold text-sm px-6 py-2 rounded-xl hover:opacity-90 disabled:opacity-40 transition"
            >
              {busy ? 'Creating…' : 'Create Prescription'}
            </button>
          </div>
        </form>
      )}

      {/* Prescriptions List */}
      <div className="grid gap-3">
        {prescriptions.map(rx => (
          <div key={rx.prescriptionId} className="bg-card-bg rounded-xl p-4 shadow-soft flex items-center justify-between">
            <div>
              <p className="font-semibold">{rx.medication}</p>
              <p className="text-text-muted text-sm">
                {rx.prescriptionId} · Patient: {rx.patientId} · By: {rx.issuedBy}
              </p>
            </div>
            <Badge className="bg-amber-100 text-amber-700">{rx.status.replace(/_/g, ' ')}</Badge>
          </div>
        ))}
        {prescriptions.length === 0 && (
          <p className="text-text-muted text-sm">No prescriptions yet</p>
        )}
      </div>
    </Section>
  )
}

// ═════════════════════════════════════════════════════════════
//  SHARED COMPONENTS
// ═════════════════════════════════════════════════════════════

function Section({ title, count, action, children }) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          {title} <span className="text-text-muted font-normal text-base">({count})</span>
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Badge({ className, children }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-pill capitalize ${className}`}>
      {children}
    </span>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <span className="text-xs uppercase tracking-wide">{label}</span>
      <p className="font-medium text-text-dark">{value || '—'}</p>
    </div>
  )
}

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent" />
    </div>
  )
}

function ErrorScreen({ msg, retry }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-red-600 font-semibold">Failed to load: {msg}</p>
      <button onClick={retry} className="bg-gradient-purple-blue text-white px-6 py-2 rounded-pill font-semibold">
        Retry
      </button>
    </div>
  )
}

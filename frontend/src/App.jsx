import { useState, useEffect, useCallback } from 'react'
import * as api from './api'
import { io } from 'socket.io-client'
import Welcome from './pages/Welcome'
import PatientSignup from './components/PatientSignup'
import OtpVerify from './components/OtpVerify'

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
const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

// ═════════════════════════════════════════════════════════════
//  App
// ═════════════════════════════════════════════════════════════

export default function App() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('welcome') // 'welcome', 'login', 'signup', 'otp'
  const [signupEmail, setSignupEmail] = useState('')

  const handleLogout = () => {
    api.logout()
    setUser(null)
    setView('welcome')
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />
  }

  if (view === 'welcome') {
    return <Welcome onNavigate={setView} />
  }

  if (view === 'signup') {
    return (
      <PatientSignup
        onSignupSuccess={(email) => {
          setSignupEmail(email)
          setView('otp')
        }}
        onNavigate={setView}
      />
    )
  }

  if (view === 'otp') {
    return (
      <OtpVerify
        email={signupEmail}
        onVerificationSuccess={(loggedInUser) => {
          setUser(loggedInUser)
        }}
        onNavigate={setView}
      />
    )
  }

  return <LoginPage onLogin={setUser} onNavigate={setView} />
}

// ═════════════════════════════════════════════════════════════
//  LOGIN PAGE
// ═════════════════════════════════════════════════════════════

function LoginPage({ onLogin, onNavigate }) {
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-tr from-purple-50 via-white to-blue-50">
      <form onSubmit={handleSubmit} className="bg-card-bg rounded-2xl shadow-soft-lg p-8 w-full max-w-md border border-gray-100 z-10">
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
          placeholder="email@madicore.com"
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
          className="w-full bg-gradient-purple-blue text-white font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition mb-4 shadow-md shadow-purple-500/20"
        >
          {busy ? 'Signing in…' : 'Sign In'}
        </button>

        <p className="text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate('signup')}
            className="text-purple-600 font-semibold hover:underline"
          >
            Sign Up
          </button>
        </p>
        <button
          type="button"
          onClick={() => onNavigate('welcome')}
          className="w-full text-center text-xs text-gray-400 mt-4 hover:underline"
        >
          Back to Welcome
        </button>
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
  const [selectedPatientId, setSelectedPatientId] = useState(null)

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

  const isAdmin = user.role === 'admin'

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-10">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-soft-lg text-sm font-medium transition-all
          ${toast.ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-purple-blue bg-clip-text text-transparent">
            Madicore Hospital
          </h1>
          <p className="text-text-muted text-sm mt-0.5">
            Welcome, <span className="font-medium text-text-dark">{user.name}</span> · <Badge className="bg-purple-100 text-purple-700">{user.role}</Badge>
          </p>
        </div>
        <button onClick={onLogout} className="text-sm text-text-muted hover:text-red-500 transition font-medium">
          Sign Out
        </button>
      </header>

      {/* Admin specific schedule view */}
      {isAdmin && (
        <AdminSchedule toast={showToast} />
      )}

      <DoctorsSection doctors={data.doctors} user={user} onRefresh={refresh} toast={showToast} />

      {!isAdmin && (
        <PatientsSection
          patients={data.patients}
          doctors={data.doctors}
          appointments={data.appointments || []}
          user={user}
          onRefresh={refresh}
          toast={showToast}
          selectedPatientId={selectedPatientId}
          setSelectedPatientId={setSelectedPatientId}
        />
      )}

      {user.role === 'patient' && (
        <PrescriptionsSection
          prescriptions={data.currentPrescriptions}
          patients={data.patients}
          doctors={data.doctors}
          user={user}
          onRefresh={refresh}
          toast={showToast}
          selectedPatient={null}
        />
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
//  ADMIN SCHEDULE VIEW
// ═════════════════════════════════════════════════════════════

function AdminSchedule({ toast }) {
  const [appointments, setAppointments] = useState([])
  const [dateFilter, setDateFilter] = useState('')
  
  useEffect(() => {
    loadSchedule()
  }, [dateFilter])

  const loadSchedule = async () => {
    try {
      const res = await api.getMasterSchedule(dateFilter)
      setAppointments(res.appointments || [])
    } catch (err) {
      toast("Failed to load schedule", false)
    }
  }

  return (
    <Section title="Master Appointment Schedule" count={appointments.length}>
      <div className="bg-card-bg rounded-2xl p-5 shadow-soft mb-6">
        <div className="mb-4">
          <label className="text-sm font-medium mr-3">Filter by Date:</label>
          <input 
            type="date" 
            value={dateFilter} 
            onChange={e => setDateFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <button 
            onClick={() => setDateFilter('')}
            className="ml-3 text-xs text-text-muted hover:text-purple-600 underline"
          >
            Clear Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-text-muted">
              <tr>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Time Slot</th>
                <th className="pb-3 font-medium">Doctor ID</th>
                <th className="pb-3 font-medium">Patient ID</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-text-muted">No appointments found.</td>
                </tr>
              ) : (
                appointments.map(apt => (
                  <tr key={apt._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="py-3 font-medium">{apt.date}</td>
                    <td className="py-3 text-purple-700 font-semibold">{apt.timeSlot}</td>
                    <td className="py-3">{apt.doctorId}</td>
                    <td className="py-3">{apt.patientId}</td>
                    <td className="py-3"><Badge className="bg-blue-100 text-blue-700">{apt.status}</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  )
}

// ═════════════════════════════════════════════════════════════
//  DOCTORS SECTION
// ═════════════════════════════════════════════════════════════

function DoctorsSection({ doctors, user, onRefresh, toast }) {
  const [busy, setBusy] = useState({})
  const [scheduleConfig, setScheduleConfig] = useState([])
  const [editingSchedule, setEditingSchedule] = useState(false)
  const [agenda, setAgenda] = useState([])

  const isDoctor = user.role === 'doctor'
  const displayDoctors = isDoctor ? doctors.filter(d => d.id === user.referenceId) : doctors
  const myProfile = displayDoctors[0]

  const fetchAgenda = useCallback(async () => {
    try {
      const res = await api.getDoctorAgenda()
      // Backend now returns { schedule: [...] }
      setAgenda(res.schedule || [])
    } catch (err) {
      toast("Failed to load agenda", false)
    }
  }, [toast])

  useEffect(() => {
    if (isDoctor && myProfile) {
      const token = sessionStorage.getItem('token');
      const socket = io({
        auth: { token },
        transports: ['websocket']
      });
      // The backend now joins the room automatically, but keeping the emit as fallback or logging is fine, though we don't need it. 
      // Actually we don't need socket.emit('joinDoctorRoom') since the backend middleware does it.
      
      // Listen live for new appointments
      socket.on('newAppointment', (data) => {
        console.log("Real-time booking received for:", data);
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

      // Listen live for the cancellation event
      socket.on('appointmentCancelled', (data) => {
        console.log("Real-time cancellation received for:", data);
        
        // Use a functional state update to force an instant, visual UI re-render
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
    <Section title={isDoctor ? "My Profile & Settings" : "Doctors Overview"} count={displayDoctors.length}>
      <div className="grid gap-4 sm:grid-cols-2">
        {displayDoctors.map(d => (
          <div key={d.id} className="bg-card-bg rounded-2xl p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{d.name}</h3>
                <p className="text-text-muted text-xs">{d.id}</p>
              </div>
              <Badge className={STATUS_COLORS[d.status]}>{d.status.replace('_', ' ')}</Badge>
            </div>

            <p className="text-text-muted text-sm">{d.specialization}</p>

            {isDoctor && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2 border-b border-gray-100 pb-1">Current Status</h4>
                <div className="flex gap-2 flex-wrap mb-4">
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

                <div className="flex items-center justify-between mb-2 border-b border-gray-100 pb-1">
                  <h4 className="text-sm font-semibold">Availability Schedule</h4>
                  <button 
                    onClick={() => {
                      if(editingSchedule) setScheduleConfig(d.availability || []) // reset
                      setEditingSchedule(!editingSchedule)
                    }}
                    className="text-xs text-purple-600 hover:underline"
                  >
                    {editingSchedule ? 'Cancel' : 'Edit Schedule'}
                  </button>
                </div>

                {editingSchedule ? (
                  <div className="space-y-3 mt-3">
                    {scheduleConfig.map((config, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded-lg text-xs">
                        <input 
                          type="date"
                          min={new Date().toLocaleDateString('en-CA')}
                          value={config.date}
                          onChange={e => handleSlotChange(idx, 'date', e.target.value)}
                          className="border border-gray-200 rounded px-2 py-1"
                        />
                        {config.slots && config.slots.map((slot, sIdx) => (
                           <div key={sIdx} className="flex items-center gap-2">
                             <input type="time" value={slot.startTime} onChange={e => handleTimeChange(idx, sIdx, 'startTime', e.target.value)} className="border border-gray-200 rounded px-2 py-1" />
                             <span>to</span>
                             <input type="time" value={slot.endTime} onChange={e => handleTimeChange(idx, sIdx, 'endTime', e.target.value)} className="border border-gray-200 rounded px-2 py-1" />
                             <select value={slot.duration} onChange={e => handleTimeChange(idx, sIdx, 'duration', e.target.value)} className="border border-gray-200 rounded px-2 py-1">
                               <option value="15">15m</option>
                               <option value="30">30m</option>
                               <option value="60">60m</option>
                             </select>
                           </div>
                        ))}
                        <button onClick={() => handleRemoveSlot(idx)} className="text-red-500 font-bold ml-auto px-2">×</button>
                      </div>
                    ))}
                    
                    <div className="flex justify-between items-center mt-3 pt-2">
                      <button onClick={handleAddSlot} className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300">
                        + Add Date Slot
                      </button>
                      <button onClick={handleSaveAvailability} disabled={busy.schedSave} className="text-xs bg-gradient-purple-blue text-white px-4 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">
                        {busy.schedSave ? 'Saving...' : 'Save Schedule'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    {agenda?.length > 0 ? (
                      agenda.map((dayObj, i) => (
                        <div key={i} className="text-xs text-text-muted flex flex-col mb-1 border p-3 rounded-xl bg-gray-50 border-gray-100">
                          <span className="font-bold text-gray-800 text-sm mb-2 pb-1 border-b border-gray-200">{formatDate(dayObj.date)}</span>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {dayObj.slots && dayObj.slots.map(slot => {
                              const isToday = dayObj.date === new Date().toLocaleDateString('en-CA');
                              let isExpired = false;
                              if (isToday) {
                                const [hours, minutes] = slot.time.split(':');
                                const slotTime = new Date();
                                slotTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                                if (slotTime <= new Date()) {
                                  isExpired = true;
                                }
                              }
                              return (
                                <div key={slot.time} className={`p-2 rounded border shadow-sm ${slot.status === 'Booked' ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'}`}>
                                  <span className="font-bold block text-gray-800">{slot.time}</span>
                                  {slot.status === 'Booked' ? (
                                    <span className="text-purple-700 font-medium block truncate mt-0.5">
                                      {slot.patient?.name} <br/>
                                      <span className="text-xs text-purple-500">Token: {slot.patient?.tokenNumber || slot.patient?.id}</span>
                                    </span>
                                  ) : isExpired ? (
                                    <span className="text-gray-400 font-medium block mt-0.5">Expired</span>
                                  ) : (
                                    <span className="text-emerald-500 font-medium block mt-0.5">Available</span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-text-muted italic">No appointments scheduled. Please set your availability slots to open bookings.</p>
                    )}
                  </div>
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
//  PATIENTS SECTION (WITH CALENDAR BOOKING)
// ═════════════════════════════════════════════════════════════

function PatientsSection({ patients, doctors, appointments, user, onRefresh, toast, selectedPatientId, setSelectedPatientId }) {
  const [bookingState, setBookingState] = useState({})
  const [busy, setBusy] = useState({})
  const [prescriptions, setPrescriptions] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingRx, setEditingRx] = useState(null)
  const [form, setForm] = useState({ prescriptionId: '', medication: '' })
  const [rxBusy, setRxBusy] = useState(false)
  
  const isPatient = user.role === 'patient'
  const displayPatients = isPatient ? patients.filter(p => p.id === user.referenceId) : patients

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

  useEffect(() => {
    if (selectedPatientId && !isPatient) {
      setShowAddForm(false)
      setEditingRx(null)
      setForm({ prescriptionId: '', medication: '' })
      api.getDoctorPatientPrescriptions(selectedPatientId)
        .then(res => setPrescriptions(res))
        .catch(err => toast(err.message, false));
    } else {
      setPrescriptions([]);
    }
  }, [selectedPatientId, isPatient, toast]);

  const handleDeleteRx = async (rx) => {
    if (!window.confirm("Are you sure you want to delete this prescription?")) return
    try {
      setPrescriptions(prev => prev.filter(item => item._id !== rx._id))
      await api.deletePrescription(rx._id)
      toast('Prescription deleted')
      onRefresh()
    } catch (err) {
      toast(err.message, false)
      api.getDoctorPatientPrescriptions(selectedPatientId).then(setPrescriptions)
    }
  }

  const handleSubmitPrescription = async (e) => {
    e.preventDefault()
    setRxBusy(true)
    try {
      if (editingRx) {
        await api.updatePrescription(editingRx._id, form.medication)
        toast('Prescription updated')
      } else {
        await api.createPrescription(form.prescriptionId, selectedPatientId, form.medication)
        toast('Prescription created')
      }
      setForm({ prescriptionId: '', medication: '' })
      setEditingRx(null)
      setShowAddForm(false)
      const res = await api.getDoctorPatientPrescriptions(selectedPatientId)
      setPrescriptions(res)
      onRefresh()
    } catch (err) {
      toast(err.message, false)
    } finally {
      setRxBusy(false)
    }
  }

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
      await onRefresh() // refresh everything
    } catch (err) {
      toast(err.message, false)
    } finally {
      setBusy(prev => ({ ...prev, [patientId]: false }))
    }
  }

  return (
    <Section title={isPatient ? "My Profile" : "Patients"} count={displayPatients.length}>
      <div className="grid gap-4">
        {displayPatients.map(p => {
          const bState = bookingState[p.id] || {}
          
          return (
            <div 
              key={p.id} 
              onClick={() => !isPatient && setSelectedPatientId(p.id)}
              className={`bg-card-bg rounded-2xl p-5 shadow-soft cursor-pointer transition border-2 ${
                !isPatient && selectedPatientId === p.id ? 'border-purple-500' : 'border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <span className="text-text-muted text-xs">{p.id}</span>
                </div>
              </div>

              {isPatient && (
                <div className="mt-4 border-t border-gray-100 pt-4" onClick={(e) => e.stopPropagation()}>
                  
                  {/* Active Appointments Display */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-sm mb-3">My Active Appointments</h4>
                    {appointments.filter(a => a.patientId === user.referenceId).length > 0 ? (
                      <div className="space-y-2">
                        {appointments.filter(a => a.patientId === user.referenceId).map(apt => (
                          <div key={apt.appointmentId} className="flex justify-between items-center p-3 bg-purple-50 rounded-xl border border-purple-100">
                            <div>
                              <p className="text-sm font-semibold text-purple-900">{apt.date} at {apt.timeSlot}</p>
                              <p className="text-xs text-purple-600 mt-0.5">Doctor ID: {apt.doctorId}</p>
                            </div>
                            <button
                              disabled={busy[apt.appointmentId]}
                              onClick={async (e) => {
                                e.stopPropagation();
                                setBusy(prev => ({ ...prev, [apt.appointmentId]: true }))
                                try {
                                  await api.cancelAppointment(apt.appointmentId)
                                  toast('Appointment cancelled successfully.')
                                  await onRefresh()
                                } catch (err) {
                                  console.error(err.response?.data?.error || err.message)
                                  toast(err.response?.data?.error || err.message, false)
                                } finally {
                                  setBusy(prev => ({ ...prev, [apt.appointmentId]: false }))
                                }
                              }}
                              className="text-xs bg-white text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
                            >
                              {busy[apt.appointmentId] ? 'Cancelling...' : 'Cancel'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted">You have no upcoming appointments.</p>
                    )}
                  </div>

                  <h4 className="font-semibold text-sm mb-3 border-t border-gray-100 pt-4">Book New Appointment</h4>
                  
                  <div className="grid sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Select Doctor</label>
                      <select
                        value={bState.doctorId || ''}
                        onChange={e => setBookingState(prev => ({ ...prev, [p.id]: { doctorId: e.target.value, date: '', slots: [] } }))}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-300"
                      >
                        <option value="">Choose a Doctor...</option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Select Date</label>
                      <input 
                        type="date"
                        min={new Date().toLocaleDateString('en-CA')}
                        disabled={!bState.doctorId}
                        value={bState.date || ''}
                        onChange={e => handleDateChange(p.id, bState.doctorId, e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-300 disabled:bg-gray-50 disabled:text-gray-400"
                      />
                    </div>
                  </div>

                  {bState.date && (
                    <div className="mt-4">
                      <label className="block text-xs text-text-muted mb-2">Available Slots</label>
                      {bState.loadingSlots ? (
                        <p className="text-xs text-blue-500 animate-pulse">Loading slots...</p>
                      ) : bState.slots && bState.slots.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {bState.slots.filter(slot => {
                            const isToday = bState.date === new Date().toLocaleDateString('en-CA');
                            if (isToday) {
                              const [hours, minutes] = slot.split(':');
                              const slotTime = new Date();
                              slotTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                              return slotTime > new Date();
                            }
                            return true;
                          }).map(slot => (
                            <button
                              key={slot}
                              onClick={() => setBookingState(prev => ({ ...prev, [p.id]: { ...bState, selectedSlot: slot } }))}
                              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                                bState.selectedSlot === slot 
                                  ? 'bg-purple-600 text-white border-purple-600' 
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-purple-400 hover:text-purple-600'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-red-500">No slots available on this date. Please choose another.</p>
                      )}
                    </div>
                  )}

                  {bState.selectedSlot && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleBookSlot(p.id)}
                        disabled={busy[p.id]}
                        className="w-full sm:w-auto bg-gradient-purple-blue text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition shadow-sm"
                      >
                        {busy[p.id] ? 'Confirming...' : `Confirm Booking for ${bState.selectedSlot}`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Historical prescriptions for this patient (Doctor View only) */}
              {!isPatient && selectedPatientId === p.id && (
                <div className="mt-4 border-t border-gray-100 pt-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-sm text-purple-700">My Historical Prescriptions</h4>
                    <button
                      onClick={() => {
                        if (showAddForm) {
                          setShowAddForm(false)
                          setEditingRx(null)
                          setForm({ prescriptionId: '', medication: '' })
                        } else {
                          setShowAddForm(true)
                        }
                      }}
                      className="text-xs bg-gradient-purple-blue text-white px-3 py-1.5 rounded-xl font-medium hover:opacity-90 transition"
                    >
                      {showAddForm ? 'Cancel' : '+ Add Prescription'}
                    </button>
                  </div>

                  {showAddForm && (
                    <form onSubmit={handleSubmitPrescription} className="bg-purple-50 rounded-xl p-4 mb-4 grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2 text-xs text-purple-700 font-semibold bg-purple-100/50 p-2.5 rounded-xl border border-purple-200">
                        {editingRx ? `Editing Prescription: ${editingRx.prescriptionId}` : 'Creating New Prescription'}
                      </div>

                      {!editingRx && (
                        <input
                          type="text"
                          placeholder="Prescription ID (e.g. RX-100)"
                          required
                          value={form.prescriptionId}
                          onChange={e => setForm(f => ({ ...f, prescriptionId: e.target.value }))}
                          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-300"
                        />
                      )}

                      <input
                        type="text"
                        placeholder="Medication (e.g. Amoxicillin 250mg)"
                        required
                        value={form.medication}
                        onChange={e => setForm(f => ({ ...f, medication: e.target.value }))}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-300 sm:col-span-2"
                      />

                      <div className="sm:col-span-2 flex gap-2">
                        <button
                          type="submit"
                          disabled={rxBusy}
                          className="bg-gradient-purple-blue text-white font-semibold text-sm px-6 py-2 rounded-xl hover:opacity-90 disabled:opacity-40 transition"
                        >
                          {rxBusy ? 'Saving…' : editingRx ? 'Update' : 'Create'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddForm(false)
                            setEditingRx(null)
                            setForm({ prescriptionId: '', medication: '' })
                          }}
                          className="bg-gray-200 text-gray-700 font-semibold text-sm px-6 py-2 rounded-xl hover:bg-gray-300 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {prescriptions.length > 0 ? (
                    <div className="space-y-2">
                      {prescriptions.map(rx => (
                        <div key={rx.prescriptionId} className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-semibold text-purple-900">{rx.medication}</p>
                            <p className="text-xs text-purple-500">ID: {rx.prescriptionId} · Status: {rx.status.replace(/_/g, ' ')}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingRx(rx)
                                setForm({ prescriptionId: rx.prescriptionId, medication: rx.medication })
                                setShowAddForm(true)
                              }}
                              className="text-xs bg-white border border-purple-200 hover:bg-purple-100 hover:text-purple-700 text-gray-600 px-2.5 py-1.5 rounded-lg font-medium transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRx(rx)}
                              className="text-xs bg-white border border-red-200 hover:bg-red-100 hover:text-red-600 text-gray-600 px-2.5 py-1.5 rounded-lg font-medium transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted italic">No past prescriptions issued by you for this patient.</p>
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

function PrescriptionsSection({ prescriptions, patients, doctors, user, onRefresh, toast, selectedPatient }) {
  const [showForm, setShowForm] = useState(false)
  const [editingRx, setEditingRx] = useState(null)
  const [form, setForm] = useState({ prescriptionId: '', medication: '' })
  const [busy, setBusy] = useState(false)
  const [localPrescriptions, setLocalPrescriptions] = useState([])

  const isDoctor = user.role === 'doctor'
  const isPatient = user.role === 'patient'

  useEffect(() => {
    setLocalPrescriptions(prescriptions)
  }, [prescriptions])

  useEffect(() => {
    if (editingRx) {
      setForm({ prescriptionId: editingRx.prescriptionId, medication: editingRx.medication })
      setShowForm(true)
    } else {
      setForm({ prescriptionId: '', medication: '' })
    }
  }, [editingRx])

  if (isDoctor && !selectedPatient) {
    return (
      <Section title="Prescriptions" count={0}>
        <div className="bg-card-bg rounded-2xl p-5 shadow-soft text-center">
          <p className="text-text-muted text-sm">Select a patient from the queue to view or manage prescriptions.</p>
        </div>
      </Section>
    )
  }

  let displayPrescriptions = localPrescriptions
  if (isPatient) displayPrescriptions = localPrescriptions.filter(p => p.patientId === user.referenceId)
  if (isDoctor) displayPrescriptions = localPrescriptions.filter(p => p.issuedBy === user.referenceId && p.patientId === selectedPatient.id)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (editingRx) {
        await api.updatePrescription(editingRx._id, form.medication)
        toast('Prescription updated')
      } else {
        await api.createPrescription(form.prescriptionId, selectedPatient.id, form.medication)
        toast('Prescription created')
      }
      setForm({ prescriptionId: '', medication: '' })
      setEditingRx(null)
      setShowForm(false)
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
      setLocalPrescriptions(prev => prev.filter(item => item._id !== rx._id))
      await api.deletePrescription(rx._id)
      toast('Prescription deleted')
      await onRefresh()
    } catch (err) {
      toast(err.message, false)
      await onRefresh()
    }
  }

  return (
    <Section
      title={isPatient ? "My Active Prescriptions" : `Prescriptions for ${selectedPatient.name}`}
      count={displayPrescriptions.length}
      action={
        isDoctor && (
          <button
            onClick={() => {
              if (showForm) {
                setEditingRx(null)
                setShowForm(false)
              } else {
                setShowForm(true)
              }
            }}
            className="text-xs bg-gradient-purple-blue text-white px-4 py-1.5 rounded-xl font-medium hover:opacity-90 transition"
          >
            {showForm ? 'Cancel' : '+ New Prescription'}
          </button>
        )
      }
    >
      {showForm && isDoctor && (
        <form onSubmit={handleSubmit} className="bg-purple-50 rounded-xl p-4 mb-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 text-xs text-purple-700 font-semibold bg-purple-100/50 p-2.5 rounded-xl border border-purple-200">
            Prescription for: <span className="text-purple-900 font-bold">{selectedPatient.name} ({selectedPatient.id})</span>
          </div>

          {!editingRx && (
            <input
              type="text"
              placeholder="Prescription ID (e.g. RX-100)"
              required
              value={form.prescriptionId}
              onChange={e => setForm(f => ({ ...f, prescriptionId: e.target.value }))}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-300"
            />
          )}

          <input
            type="text"
            placeholder="Medication (e.g. Amoxicillin 250mg)"
            required
            value={form.medication}
            onChange={e => setForm(f => ({ ...f, medication: e.target.value }))}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-300 sm:col-span-2"
          />

          <div className="sm:col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="bg-gradient-purple-blue text-white font-semibold text-sm px-6 py-2 rounded-xl hover:opacity-90 disabled:opacity-40 transition"
            >
              {busy ? 'Saving…' : editingRx ? 'Update Prescription' : 'Create Prescription'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingRx(null)
                setForm({ prescriptionId: '', medication: '' })
              }}
              className="bg-gray-200 text-gray-700 font-semibold text-sm px-6 py-2 rounded-xl hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {displayPrescriptions.map(rx => (
          <div key={rx.prescriptionId} className="bg-card-bg rounded-xl p-4 shadow-soft flex items-center justify-between">
            <div>
              <p className="font-semibold">{rx.medication}</p>
              <p className="text-text-muted text-sm">{rx.prescriptionId} · Patient: {rx.patientId} · By: {rx.issuedBy}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-amber-100 text-amber-700">{rx.status.replace(/_/g, ' ')}</Badge>
              {isDoctor && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditingRx(rx)}
                    className="text-xs bg-gray-100 hover:bg-purple-100 hover:text-purple-700 text-gray-600 px-2.5 py-1.5 rounded-lg font-medium transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(rx)}
                    className="text-xs bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-600 px-2.5 py-1.5 rounded-lg font-medium transition"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {displayPrescriptions.length === 0 && <p className="text-text-muted text-sm">No prescriptions found</p>}
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
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-pill capitalize ${className}`}>{children}</span>
}

function Stat({ label, value }) {
  return <div><span className="text-xs uppercase tracking-wide">{label}</span><p className="font-medium text-text-dark">{value || '—'}</p></div>
}

function Loader() {
  return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent" /></div>
}

function ErrorScreen({ msg, retry }) {
  return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p className="text-red-600 font-semibold">Failed to load: {msg}</p><button onClick={retry} className="bg-gradient-purple-blue text-white px-6 py-2 rounded-pill font-semibold">Retry</button></div>
}

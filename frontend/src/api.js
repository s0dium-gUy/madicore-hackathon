// ── Centralized API client ──────────────────────────────────
// All backend calls go through this module.
// Vite proxy handles /api → http://localhost:5000 in dev.

const BASE = '/api'

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE}${path}`, opts)
  const data = await res.json()

  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}

// ── Auth ──
export const login = (email, password) =>
  request('POST', '/login', { email, password })

// ── Hospital (master) ──
export const getHospitalData = () =>
  request('GET', '/hospital')

// ── Doctors ──
export const getDoctors = () =>
  request('GET', '/doctors')

export const getDoctorQueue = (id) =>
  request('GET', `/doctors/${id}/queue`)

export const updateDoctorStatus = (id, status) =>
  request('PATCH', `/doctors/${id}/status`, { status })

export const updateDoctorAvailability = (id, availabilitySchedule) =>
  request('PATCH', `/doctors/${id}/availability`, { availabilitySchedule })

// ── Patients ──
export const getPatientQueue = (id) =>
  request('GET', `/patients/${id}/queue`)

export const getPatientHistory = (id) =>
  request('GET', `/patients/${id}/medical-history`)

export const getPatientStats = (id) =>
  request('GET', `/patients/${id}/stats`)

export const bookSlot = (patientId, doctorId, timeSlot) =>
  request('POST', `/patients/${patientId}/book-slot`, { doctorId, timeSlot })

export const fastTrack = (patientId) =>
  request('POST', `/patients/${patientId}/fast-track`)

export const updateQueueStatus = (patientId, queueStatus) =>
  request('PATCH', `/patients/${patientId}/queue`, { queueStatus })

export const markComplete = (patientId) =>
  request('PATCH', `/patients/${patientId}/complete`)

export const createPrescription = (patientId, prescriptionId, medication, issuedBy) =>
  request('POST', `/patients/${patientId}/prescription`, { prescriptionId, medication, issuedBy })

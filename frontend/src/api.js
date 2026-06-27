// ── Centralized API client ──────────────────────────────────
const BASE = '/api'

// Helper to get token from storage
const getToken = () => sessionStorage.getItem('token');

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  
  const token = getToken();
  if (token) {
    opts.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE}${path}`, opts)
  let data;
  try {
    data = await res.json()
  } catch (parseErr) {
    throw new Error(`Server returned non-JSON response (Status: ${res.status})`);
  }

  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`)
    err.status = res.status
    // If unauthorized, could trigger a logout event here
    throw err
  }
  return data
}

// ── Auth ──
export const login = async (email, password) => {
  const res = await request('POST', '/login', { email, password });
  if (res.token) {
    sessionStorage.setItem('token', res.token);
  }
  return res;
}

export const logout = () => {
  sessionStorage.removeItem('token');
}

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

export const updateDoctorAvailability = (availability) =>
  request('PUT', `/doctors/availability`, { availability })

// ── Appointments (Scheduling) ──
export const getAvailableSlots = (doctorId, date) =>
  request('GET', `/appointments/doctors/${doctorId}/available-slots?date=${date}`)

export const bookAppointment = (doctorId, date, timeSlot) =>
  request('POST', `/appointments/book`, { doctorId, date, timeSlot })

export const cancelAppointment = (appointmentId) =>
  request('DELETE', `/appointments/${appointmentId}/cancel`)

export const getMasterSchedule = (date = '') => {
  const query = date ? `?date=${date}` : '';
  return request('GET', `/appointments/schedule${query}`);
}

export const getDoctorAgenda = () =>
  request('GET', `/appointments/doctor-agenda`)

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

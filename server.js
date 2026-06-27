// ─────────────────────────────────────────────────────────────
//  Hospital Queue Management System — server.js
//  Stack: Node.js · Express · Plain in-memory state store
// ─────────────────────────────────────────────────────────────

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const state = {
  doctors: [],
  patients: [],
  pastRecords: [],
  prescriptions: [],
};

let seeded = false;
const VALID_STATUSES = ["available", "on_break", "unavailable"];
const VALID_QUEUE = ["waiting", "in_consultation", "completed", "no_show"];

function createTables() {
  return true;
}

function seedDatabase() {
  if (seeded) return;

  state.doctors.push(
    {
      id: "DOC-101",
      name: "Dr. Sharma",
      specialization: "General Medicine",
      status: "available",
      statusLastUpdated: "2026-06-27T10:00:00Z",
      availabilitySchedule: "10:00-13:00, 14:00-18:00",
      currentPatientCount: 2,
    },
    {
      id: "DOC-102",
      name: "Dr. Patel",
      specialization: "Orthopedics",
      status: "on_break",
      statusLastUpdated: "2026-06-27T12:30:00Z",
      availabilitySchedule: "09:00-12:00",
      currentPatientCount: 0,
    }
  );

  state.patients.push({
    id: "PAT-001",
    name: "Naman Gabbur",
    tokenNumber: "T-01",
    queueStatus: "waiting",
    routingPreference: "fastest_available",
    assignedDoctorId: "DOC-101",
    bookedTimeSlot: "10:30-10:45",
    age: 21,
    bloodGroup: "O+",
    bp: "120/80",
    temp: "98.6F",
  });

  state.pastRecords.push({
    patientId: "PAT-001",
    date: "2025-11-15",
    diagnosis: "Viral Infection",
    notes: "Cleared up after 3 days",
  });

  state.prescriptions.push({
    prescriptionId: "RX-992",
    patientId: "PAT-001",
    medication: "Paracetamol 500mg",
    status: "pending_at_pharmacy",
    issuedBy: "DOC-101",
  });

  seeded = true;
}

function getDoctorById(id) {
  return state.doctors.find((doctor) => doctor.id === id);
}

function getPatientById(id) {
  return state.patients.find((patient) => patient.id === id);
}

function getActiveQueueForDoctor(doctorId) {
  return state.patients
    .filter((patient) => patient.assignedDoctorId === doctorId && (patient.queueStatus === "waiting" || patient.queueStatus === "in_consultation"))
    .sort((a, b) => a.bookedTimeSlot.localeCompare(b.bookedTimeSlot));
}

function buildQueueSummary(patient) {
  const doctor = getDoctorById(patient.assignedDoctorId);
  const queue = state.patients
    .filter((entry) => entry.assignedDoctorId === patient.assignedDoctorId && (entry.queueStatus === "waiting" || entry.queueStatus === "in_consultation"))
    .sort((a, b) => a.bookedTimeSlot.localeCompare(b.bookedTimeSlot));

  const position = queue.findIndex((entry) => entry.id === patient.id) + 1;
  return {
    id: patient.id,
    name: patient.name,
    tokenNumber: patient.tokenNumber,
    position: position > 0 ? position : 1,
    queueStatus: patient.queueStatus,
    assignedDoctorId: patient.assignedDoctorId,
    bookedTimeSlot: patient.bookedTimeSlot,
    doctorName: doctor ? doctor.name : null,
  };
}

function updateDoctorCount(doctorId, delta) {
  const doctor = getDoctorById(doctorId);
  if (doctor) {
    doctor.currentPatientCount = Math.max(0, doctor.currentPatientCount + delta);
  }
}

function setDoctorStatus(doctorId, status) {
  const doctor = getDoctorById(doctorId);
  if (!doctor) return null;
  doctor.status = status;
  doctor.statusLastUpdated = new Date().toISOString();
  return doctor;
}

function createPrescription(patientId, prescriptionId, medication, issuedBy, status = "pending_at_pharmacy") {
  const patient = getPatientById(patientId);
  const doctor = getDoctorById(issuedBy);
  if (!patient || !doctor) return null;

  const record = {
    prescriptionId,
    patientId,
    medication,
    status,
    issuedBy,
  };
  state.prescriptions.push(record);
  return record;
}

function getMedicalHistory(patientId) {
  const patient = getPatientById(patientId);
  if (!patient) return null;

  return {
    patient,
    pastRecords: state.pastRecords.filter((record) => record.patientId === patientId),
    currentPrescriptions: state.prescriptions.filter((record) => record.patientId === patientId),
  };
}

function getPatientStats(patientId) {
  const history = getMedicalHistory(patientId);
  if (!history) return null;

  const activeQueue = buildQueueSummary(history.patient);
  return {
    ...history.patient,
    queue: activeQueue,
    pastRecords: history.pastRecords,
    prescriptions: history.currentPrescriptions,
  };
}

function bookTimeSlot(patientId, doctorId, timeSlot) {
  const patient = getPatientById(patientId);
  const doctor = getDoctorById(doctorId);
  if (!patient || !doctor) return null;

  if (patient.assignedDoctorId && patient.assignedDoctorId !== doctorId) {
    updateDoctorCount(patient.assignedDoctorId, -1);
  }

  patient.assignedDoctorId = doctorId;
  patient.bookedTimeSlot = timeSlot;
  patient.queueStatus = "waiting";
  if (!patient.assignedDoctorId || patient.assignedDoctorId === doctorId) {
    updateDoctorCount(doctorId, 1);
  }
  return patient;
}

function allocateFastTrack(patientId) {
  const patient = getPatientById(patientId);
  if (!patient) return null;

  const candidates = state.doctors
    .filter((doctor) => doctor.status === "available")
    .sort((a, b) => a.currentPatientCount - b.currentPatientCount || a.name.localeCompare(b.name));

  const doctor = candidates[0] || state.doctors.find((entry) => entry.status !== "offline");
  if (!doctor) return null;

  if (patient.assignedDoctorId && patient.assignedDoctorId !== doctor.id) {
    updateDoctorCount(patient.assignedDoctorId, -1);
  }

  patient.assignedDoctorId = doctor.id;
  patient.bookedTimeSlot = "Immediate allocation";
  patient.queueStatus = "waiting";
  updateDoctorCount(doctor.id, 1);
  return { patient, doctor };
}

function markAppointmentDone(patientId) {
  const patient = getPatientById(patientId);
  if (!patient) return null;
  patient.queueStatus = "completed";
  if (patient.assignedDoctorId) {
    updateDoctorCount(patient.assignedDoctorId, -1);
  }
  return patient;
}

createTables();
seedDatabase();

// ── Frontend Pages ─────────────────────────────────────────
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/login", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// ── Login API ──────────────────────────────────────────────
app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Please enter your email and password." });
  }

  const validUsers = {
    "doctor@madicore.com": {
      password: "madicore123",
      name: "Dr. Aarav Sharma",
      role: "Medical Officer",
    },
    "admin@madicore.com": {
      password: "admin123",
      name: "Riya Kapoor",
      role: "Hospital Admin",
    },
  };

  const user = validUsers[email.toLowerCase()];

  if (!user || user.password !== password) {
    return res.status(401).json({
      error: "Invalid credentials. Try doctor@madicore.com / madicore123.",
    });
  }

  return res.json({
    message: "Login successful",
    user: {
      email,
      name: user.name,
      role: user.role,
    },
  });
});

// ── GET /api/hospital — Master endpoint ─────────────────────
app.get("/api/hospital", (_req, res) => {
  try {
    return res.json({
      doctors: state.doctors,
      patients: state.patients,
      pastRecords: state.pastRecords,
      currentPrescriptions: state.prescriptions,
    });
  } catch (err) {
    console.error("[GET /api/hospital]", err.message);
    return res.status(500).json({ error: "Failed to fetch hospital data." });
  }
});

// ── GET /api/doctors ───────────────────────────────────────
app.get("/api/doctors", (_req, res) => {
  res.json(state.doctors);
});

// ── GET /api/patients/:id/queue ────────────────────────────
app.get("/api/patients/:id/queue", (req, res) => {
  const patient = getPatientById(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: "Patient not found." });
  }
  return res.json(buildQueueSummary(patient));
});

// ── GET /api/patients/:id/medical-history ─────────────────
app.get("/api/patients/:id/medical-history", (req, res) => {
  const history = getMedicalHistory(req.params.id);
  if (!history) {
    return res.status(404).json({ error: "Patient not found." });
  }
  return res.json(history);
});

// ── GET /api/patients/:id/stats ────────────────────────────
app.get("/api/patients/:id/stats", (req, res) => {
  const stats = getPatientStats(req.params.id);
  if (!stats) {
    return res.status(404).json({ error: "Patient not found." });
  }
  return res.json(stats);
});

// ── POST /api/patients/:id/book-slot ──────────────────────
app.post("/api/patients/:id/book-slot", (req, res) => {
  const { doctorId, timeSlot } = req.body || {};
  if (!doctorId || !timeSlot) {
    return res.status(400).json({ error: "doctorId and timeSlot are required." });
  }

  const updated = bookTimeSlot(req.params.id, doctorId, timeSlot);
  if (!updated) {
    return res.status(404).json({ error: "Patient or doctor not found." });
  }

  return res.json(updated);
});

// ── POST /api/patients/:id/fast-track ─────────────────────
app.post("/api/patients/:id/fast-track", (req, res) => {
  const assigned = allocateFastTrack(req.params.id);
  if (!assigned) {
    return res.status(404).json({ error: "Patient not found or no doctor available." });
  }
  return res.json(assigned);
});

// ── PATCH /api/doctors/:id/status ───────────────────────────
app.patch("/api/doctors/:id/status", (req, res) => {
  const { status } = req.body || {};
  if (!status) {
    return res.status(400).json({ error: "Missing required field: status" });
  }

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
  }

  const updated = setDoctorStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: `Doctor ${req.params.id} not found.` });
  }
  return res.json(updated);
});

// ── PATCH /api/doctors/:id/availability ───────────────────
app.patch("/api/doctors/:id/availability", (req, res) => {
  const { availabilitySchedule } = req.body || {};
  const doctor = getDoctorById(req.params.id);
  if (!doctor) {
    return res.status(404).json({ error: `Doctor ${req.params.id} not found.` });
  }
  if (!availabilitySchedule) {
    return res.status(400).json({ error: "availabilitySchedule is required." });
  }

  doctor.availabilitySchedule = availabilitySchedule;
  return res.json(doctor);
});

// ── GET /api/doctors/:id/queue ────────────────────────────
app.get("/api/doctors/:id/queue", (req, res) => {
  const doctor = getDoctorById(req.params.id);
  if (!doctor) {
    return res.status(404).json({ error: "Doctor not found." });
  }
  return res.json(getActiveQueueForDoctor(req.params.id));
});

// ── PATCH /api/patients/:id/queue ───────────────────────────
app.patch("/api/patients/:id/queue", (req, res) => {
  const { queueStatus } = req.body || {};
  if (!queueStatus) {
    return res.status(400).json({ error: "Missing required field: queueStatus" });
  }

  if (!VALID_QUEUE.includes(queueStatus)) {
    return res.status(400).json({ error: `Invalid queueStatus. Must be one of: ${VALID_QUEUE.join(", ")}` });
  }

  const patient = getPatientById(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: `Patient ${req.params.id} not found.` });
  }

  patient.queueStatus = queueStatus;
  if (queueStatus === "completed" || queueStatus === "no_show") {
    if (patient.assignedDoctorId) {
      updateDoctorCount(patient.assignedDoctorId, -1);
    }
  }
  return res.json(patient);
});

// ── PATCH /api/patients/:id/complete ───────────────────────
app.patch("/api/patients/:id/complete", (req, res) => {
  const patient = markAppointmentDone(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: "Patient not found." });
  }
  return res.json(patient);
});

// ── POST /api/patients/:id/prescription ───────────────────
app.post("/api/patients/:id/prescription", (req, res) => {
  const { prescriptionId, medication, issuedBy, status } = req.body || {};
  if (!prescriptionId || !medication || !issuedBy) {
    return res.status(400).json({ error: "Missing required fields: prescriptionId, medication, issuedBy" });
  }

  const created = createPrescription(req.params.id, prescriptionId, medication, issuedBy, status);
  if (!created) {
    return res.status(404).json({ error: "Patient or doctor not found." });
  }
  return res.status(201).json(created);
});

// ── Health check ────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

module.exports = { app };

// ─────────────────────────────────────────────────────────────
//  4. Bootstrap
// ─────────────────────────────────────────────────────────────
function bootstrap() {
  createTables();
  seedDatabase();
  console.log("✔  Database tables created & seeded.");

  app.listen(PORT, () => {
    console.log(`🏥  Hospital Queue API running → http://localhost:${PORT}`);
    console.log(`   Login page → http://localhost:${PORT}/login`);
    console.log(`   Master endpoint → http://localhost:${PORT}/api/hospital`);
  });
}

if (require.main === module) {
  bootstrap();
}

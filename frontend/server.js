/**
 * Smart OPD Queue Management System — Backend Server
 *
 * Express server that:
 *  1. Serves the static frontend (HTML/CSS/JS)
 *  2. Exposes REST API endpoints for doctors & patients
 *  3. Supports CRUD-like operations for queue management
 */

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve frontend files


// ─── In-Memory Data Store ────────────────────────────────────────────────────

const db = {
  doctors: [
    {
      id: "DOC-101",
      name: "Dr. Sharma",
      specialization: "General Medicine",
      status: "available",
      statusLastUpdated: "2026-06-27T10:00:00Z",
      availabilitySchedule: ["10:00-13:00", "14:00-18:00"],
      currentPatientCount: 2,
    },
    {
      id: "DOC-102",
      name: "Dr. Patel",
      specialization: "Orthopedics",
      status: "on_break",
      statusLastUpdated: "2026-06-27T12:30:00Z",
      availabilitySchedule: ["09:00-12:00"],
      currentPatientCount: 0,
    },
  ],

  patients: [
    {
      id: "PAT-001",
      name: "Naman Gabbur",
      tokenNumber: "T-01",
      queueStatus: "waiting",
      routingPreference: "fastest_available",
      assignedDoctorId: "DOC-101",
      bookedTimeSlot: "10:30-10:45",
      patientStats: {
        age: 21,
        bloodGroup: "O+",
        vitals: { bp: "120/80", temp: "98.6F" },
      },
      pastRecords: [
        {
          date: "2025-11-15",
          diagnosis: "Viral Infection",
          notes: "Cleared up after 3 days",
        },
      ],
      currentPrescriptions: [
        {
          prescriptionId: "RX-992",
          medication: "Paracetamol 500mg",
          status: "pending_at_pharmacy",
          issuedBy: "DOC-101",
        },
      ],
    },
  ],

  // Auto-increment counters
  _nextDoctorNum: 103,
  _nextPatientNum: 2,
  _nextTokenNum: 2,
  _nextRxNum: 993,
};


// ─── HELPER: Generate IDs ────────────────────────────────────────────────────

function nextDoctorId() {
  return `DOC-${db._nextDoctorNum++}`;
}
function nextPatientId() {
  return `PAT-${String(db._nextPatientNum++).padStart(3, "0")}`;
}
function nextToken() {
  return `T-${String(db._nextTokenNum++).padStart(2, "0")}`;
}
function nextRxId() {
  return `RX-${db._nextRxNum++}`;
}


// ═══════════════════════════════════════════════════════════════════════════════
//  API ROUTES — DOCTORS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/doctors — List all doctors
app.get("/api/doctors", (req, res) => {
  res.json({ success: true, data: db.doctors });
});

// GET /api/doctors/:id — Get single doctor
app.get("/api/doctors/:id", (req, res) => {
  const doctor = db.doctors.find((d) => d.id === req.params.id);
  if (!doctor) {
    return res.status(404).json({ success: false, error: "Doctor not found" });
  }
  res.json({ success: true, data: doctor });
});

// POST /api/doctors — Add a new doctor
app.post("/api/doctors", (req, res) => {
  const { name, specialization, availabilitySchedule } = req.body;

  if (!name || !specialization) {
    return res.status(400).json({
      success: false,
      error: "name and specialization are required",
    });
  }

  const newDoctor = {
    id: nextDoctorId(),
    name,
    specialization,
    status: "available",
    statusLastUpdated: new Date().toISOString(),
    availabilitySchedule: availabilitySchedule || [],
    currentPatientCount: 0,
  };

  db.doctors.push(newDoctor);
  res.status(201).json({ success: true, data: newDoctor });
});

// PATCH /api/doctors/:id/status — Update doctor status
app.patch("/api/doctors/:id/status", (req, res) => {
  const doctor = db.doctors.find((d) => d.id === req.params.id);
  if (!doctor) {
    return res.status(404).json({ success: false, error: "Doctor not found" });
  }

  const { status } = req.body;
  if (!["available", "on_break"].includes(status)) {
    return res.status(400).json({
      success: false,
      error: "status must be 'available' or 'on_break'",
    });
  }

  doctor.status = status;
  doctor.statusLastUpdated = new Date().toISOString();
  res.json({ success: true, data: doctor });
});


// ═══════════════════════════════════════════════════════════════════════════════
//  API ROUTES — PATIENTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/patients — List all patients
app.get("/api/patients", (req, res) => {
  res.json({ success: true, data: db.patients });
});

// GET /api/patients/:id — Get single patient
app.get("/api/patients/:id", (req, res) => {
  const patient = db.patients.find((p) => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ success: false, error: "Patient not found" });
  }
  res.json({ success: true, data: patient });
});

// POST /api/patients — Register a new patient into the queue
app.post("/api/patients", (req, res) => {
  const {
    name,
    assignedDoctorId,
    bookedTimeSlot,
    routingPreference,
    patientStats,
  } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ success: false, error: "name is required" });
  }

  // Validate assigned doctor exists (if provided)
  if (assignedDoctorId) {
    const doctor = db.doctors.find((d) => d.id === assignedDoctorId);
    if (!doctor) {
      return res
        .status(400)
        .json({ success: false, error: `Doctor ${assignedDoctorId} not found` });
    }
    doctor.currentPatientCount++;
  }

  const newPatient = {
    id: nextPatientId(),
    name,
    tokenNumber: nextToken(),
    queueStatus: "waiting",
    routingPreference: routingPreference || "fastest_available",
    assignedDoctorId: assignedDoctorId || null,
    bookedTimeSlot: bookedTimeSlot || null,
    patientStats: patientStats || {
      age: null,
      bloodGroup: null,
      vitals: { bp: null, temp: null },
    },
    pastRecords: [],
    currentPrescriptions: [],
  };

  db.patients.push(newPatient);
  res.status(201).json({ success: true, data: newPatient });
});

// PATCH /api/patients/:id/status — Update queue status
app.patch("/api/patients/:id/status", (req, res) => {
  const patient = db.patients.find((p) => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ success: false, error: "Patient not found" });
  }

  const { queueStatus } = req.body;
  const validStatuses = ["waiting", "in_consultation", "completed"];
  if (!validStatuses.includes(queueStatus)) {
    return res.status(400).json({
      success: false,
      error: `queueStatus must be one of: ${validStatuses.join(", ")}`,
    });
  }

  // If completed, decrement the assigned doctor's patient count
  if (queueStatus === "completed" && patient.queueStatus !== "completed") {
    const doctor = db.doctors.find((d) => d.id === patient.assignedDoctorId);
    if (doctor && doctor.currentPatientCount > 0) {
      doctor.currentPatientCount--;
    }
  }

  patient.queueStatus = queueStatus;
  res.json({ success: true, data: patient });
});

// PATCH /api/patients/:id/vitals — Update patient vitals
app.patch("/api/patients/:id/vitals", (req, res) => {
  const patient = db.patients.find((p) => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ success: false, error: "Patient not found" });
  }

  const { bp, temp } = req.body;
  if (bp) patient.patientStats.vitals.bp = bp;
  if (temp) patient.patientStats.vitals.temp = temp;

  res.json({ success: true, data: patient });
});

// POST /api/patients/:id/prescriptions — Add a prescription
app.post("/api/patients/:id/prescriptions", (req, res) => {
  const patient = db.patients.find((p) => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ success: false, error: "Patient not found" });
  }

  const { medication, issuedBy } = req.body;
  if (!medication || !issuedBy) {
    return res.status(400).json({
      success: false,
      error: "medication and issuedBy are required",
    });
  }

  const rx = {
    prescriptionId: nextRxId(),
    medication,
    status: "pending_at_pharmacy",
    issuedBy,
  };

  patient.currentPrescriptions.push(rx);
  res.status(201).json({ success: true, data: rx });
});

// PATCH /api/patients/:id/prescriptions/:rxId — Update pharmacy status
app.patch("/api/patients/:id/prescriptions/:rxId", (req, res) => {
  const patient = db.patients.find((p) => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ success: false, error: "Patient not found" });
  }

  const rx = patient.currentPrescriptions.find(
    (r) => r.prescriptionId === req.params.rxId
  );
  if (!rx) {
    return res
      .status(404)
      .json({ success: false, error: "Prescription not found" });
  }

  const { status } = req.body;
  const validStatuses = [
    "pending_at_pharmacy",
    "ready_for_pickup",
    "dispensed",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `status must be one of: ${validStatuses.join(", ")}`,
    });
  }

  rx.status = status;
  res.json({ success: true, data: rx });
});


// ─── Combined endpoint (matches the original JSON shape) ─────────────────────
app.get("/api/dashboard", (req, res) => {
  res.json({
    success: true,
    data: {
      doctors: db.doctors,
      patients: db.patients,
    },
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
//  FALLBACK — Serve index.html for any non-API route
// ═══════════════════════════════════════════════════════════════════════════════

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


// ─── START SERVER ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  🏥  Smart OPD Server running at:`);
  console.log(`      http://localhost:${PORT}\n`);
  console.log(`  API Endpoints:`);
  console.log(`      GET    /api/dashboard`);
  console.log(`      GET    /api/doctors`);
  console.log(`      POST   /api/doctors`);
  console.log(`      PATCH  /api/doctors/:id/status`);
  console.log(`      GET    /api/patients`);
  console.log(`      POST   /api/patients`);
  console.log(`      PATCH  /api/patients/:id/status`);
  console.log(`      PATCH  /api/patients/:id/vitals`);
  console.log(`      POST   /api/patients/:id/prescriptions`);
  console.log(`      PATCH  /api/patients/:id/prescriptions/:rxId\n`);
});

// ─────────────────────────────────────────────────────────────
//  Hospital Queue Management System — server.js
//  Stack: Node.js · Express · SQLite3 (in-memory, via better-sqlite3)
// ─────────────────────────────────────────────────────────────

const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Database (in-memory) ────────────────────────────────────
const db = new Database(":memory:", { verbose: process.env.DEBUG ? console.log : undefined });

// Enable WAL mode & foreign keys for safety
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ─────────────────────────────────────────────────────────────
//  1. Schema Creation
// ─────────────────────────────────────────────────────────────
function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS doctors (
      id                  TEXT PRIMARY KEY,
      name                TEXT NOT NULL,
      specialization      TEXT NOT NULL,
      status              TEXT NOT NULL DEFAULT 'available',
      statusLastUpdated   TEXT NOT NULL,
      availabilitySchedule TEXT NOT NULL,
      currentPatientCount INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS patients (
      id                  TEXT PRIMARY KEY,
      name                TEXT NOT NULL,
      tokenNumber         TEXT NOT NULL UNIQUE,
      queueStatus         TEXT NOT NULL DEFAULT 'waiting',
      routingPreference   TEXT NOT NULL DEFAULT 'fastest_available',
      assignedDoctorId    TEXT,
      bookedTimeSlot      TEXT,
      age                 INTEGER,
      bloodGroup          TEXT,
      bp                  TEXT,
      temp                TEXT,
      FOREIGN KEY (assignedDoctorId) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS past_records (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId   TEXT NOT NULL,
      date        TEXT NOT NULL,
      diagnosis   TEXT NOT NULL,
      notes       TEXT,
      FOREIGN KEY (patientId) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      prescriptionId TEXT PRIMARY KEY,
      patientId      TEXT NOT NULL,
      medication     TEXT NOT NULL,
      status         TEXT NOT NULL DEFAULT 'pending_at_pharmacy',
      issuedBy       TEXT NOT NULL,
      FOREIGN KEY (patientId) REFERENCES patients(id),
      FOREIGN KEY (issuedBy)  REFERENCES doctors(id)
    );
  `);
}

// ─────────────────────────────────────────────────────────────
//  2. Seed Data
// ─────────────────────────────────────────────────────────────
function seedDatabase() {
  const insertDoctor = db.prepare(`
    INSERT OR IGNORE INTO doctors (id, name, specialization, status, statusLastUpdated, availabilitySchedule, currentPatientCount)
    VALUES (@id, @name, @specialization, @status, @statusLastUpdated, @availabilitySchedule, @currentPatientCount)
  `);

  const insertPatient = db.prepare(`
    INSERT OR IGNORE INTO patients (id, name, tokenNumber, queueStatus, routingPreference, assignedDoctorId, bookedTimeSlot, age, bloodGroup, bp, temp)
    VALUES (@id, @name, @tokenNumber, @queueStatus, @routingPreference, @assignedDoctorId, @bookedTimeSlot, @age, @bloodGroup, @bp, @temp)
  `);

  const insertPastRecord = db.prepare(`
    INSERT OR IGNORE INTO past_records (patientId, date, diagnosis, notes)
    VALUES (@patientId, @date, @diagnosis, @notes)
  `);

  const insertPrescription = db.prepare(`
    INSERT OR IGNORE INTO prescriptions (prescriptionId, patientId, medication, status, issuedBy)
    VALUES (@prescriptionId, @patientId, @medication, @status, @issuedBy)
  `);

  // Wrap all inserts in a single transaction for atomicity & speed
  const seed = db.transaction(() => {
    // ── Doctors ──
    insertDoctor.run({
      id: "DOC-101",
      name: "Dr. Sharma",
      specialization: "General Medicine",
      status: "available",
      statusLastUpdated: "2026-06-27T10:00:00Z",
      availabilitySchedule: "10:00-13:00, 14:00-18:00",
      currentPatientCount: 2,
    });
    insertDoctor.run({
      id: "DOC-102",
      name: "Dr. Patel",
      specialization: "Orthopedics",
      status: "on_break",
      statusLastUpdated: "2026-06-27T12:30:00Z",
      availabilitySchedule: "09:00-12:00",
      currentPatientCount: 0,
    });

    // ── Patients ──
    insertPatient.run({
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

    // ── Past Records ──
    insertPastRecord.run({
      patientId: "PAT-001",
      date: "2025-11-15",
      diagnosis: "Viral Infection",
      notes: "Cleared up after 3 days",
    });

    // ── Prescriptions ──
    insertPrescription.run({
      prescriptionId: "RX-992",
      patientId: "PAT-001",
      medication: "Paracetamol 500mg",
      status: "pending_at_pharmacy",
      issuedBy: "DOC-101",
    });
  });

  seed();
}

// ─────────────────────────────────────────────────────────────
//  3. API Routes
// ─────────────────────────────────────────────────────────────

// ── GET /api/hospital — Master endpoint ─────────────────────
// Fetches ALL tables and constructs the unified JSON contract.
app.get("/api/hospital", (_req, res) => {
  try {
    const doctors = db.prepare("SELECT * FROM doctors").all();

    const patients = db.prepare("SELECT * FROM patients").all();

    const pastRecords = db
      .prepare("SELECT patientId, date, diagnosis, notes FROM past_records")
      .all();

    const currentPrescriptions = db
      .prepare("SELECT prescriptionId, patientId, medication, status, issuedBy FROM prescriptions")
      .all();

    return res.json({
      doctors,
      patients,
      pastRecords,
      currentPrescriptions,
    });
  } catch (err) {
    console.error("[GET /api/hospital]", err.message);
    return res.status(500).json({ error: "Failed to fetch hospital data." });
  }
});

// ── PATCH /api/doctors/:id/status ───────────────────────────
// Body: { "status": "on_break" | "available" | "unavailable" }
app.patch("/api/doctors/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Missing required field: status" });
  }

  const VALID_STATUSES = ["available", "on_break", "unavailable"];
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
    });
  }

  try {
    const now = new Date().toISOString();

    const result = db
      .prepare("UPDATE doctors SET status = ?, statusLastUpdated = ? WHERE id = ?")
      .run(status, now, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: `Doctor ${id} not found.` });
    }

    const updated = db.prepare("SELECT * FROM doctors WHERE id = ?").get(id);
    return res.json(updated);
  } catch (err) {
    console.error("[PATCH /api/doctors/:id/status]", err.message);
    return res.status(500).json({ error: "Failed to update doctor status." });
  }
});

// ── PATCH /api/patients/:id/queue ───────────────────────────
// Body: { "queueStatus": "in_consultation" | "completed" | "no_show" }
app.patch("/api/patients/:id/queue", (req, res) => {
  const { id } = req.params;
  const { queueStatus } = req.body;

  if (!queueStatus) {
    return res.status(400).json({ error: "Missing required field: queueStatus" });
  }

  const VALID_QUEUE = ["waiting", "in_consultation", "completed", "no_show"];
  if (!VALID_QUEUE.includes(queueStatus)) {
    return res.status(400).json({
      error: `Invalid queueStatus. Must be one of: ${VALID_QUEUE.join(", ")}`,
    });
  }

  try {
    const result = db
      .prepare("UPDATE patients SET queueStatus = ? WHERE id = ?")
      .run(queueStatus, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: `Patient ${id} not found.` });
    }

    // If patient is completed or no-show, decrement their assigned doctor's count
    if (queueStatus === "completed" || queueStatus === "no_show") {
      const patient = db.prepare("SELECT assignedDoctorId FROM patients WHERE id = ?").get(id);
      if (patient?.assignedDoctorId) {
        db.prepare(
          "UPDATE doctors SET currentPatientCount = MAX(currentPatientCount - 1, 0) WHERE id = ?"
        ).run(patient.assignedDoctorId);
      }
    }

    const updated = db.prepare("SELECT * FROM patients WHERE id = ?").get(id);
    return res.json(updated);
  } catch (err) {
    console.error("[PATCH /api/patients/:id/queue]", err.message);
    return res.status(500).json({ error: "Failed to update queue status." });
  }
});

// ── POST /api/patients/:id/prescription ─────────────────────
// Body: { "prescriptionId": "RX-...", "medication": "...", "issuedBy": "DOC-..." }
app.post("/api/patients/:id/prescription", (req, res) => {
  const { id: patientId } = req.params;
  const { prescriptionId, medication, issuedBy, status } = req.body;

  // Validate required fields
  if (!prescriptionId || !medication || !issuedBy) {
    return res.status(400).json({
      error: "Missing required fields: prescriptionId, medication, issuedBy",
    });
  }

  try {
    // Verify the patient exists
    const patient = db.prepare("SELECT id FROM patients WHERE id = ?").get(patientId);
    if (!patient) {
      return res.status(404).json({ error: `Patient ${patientId} not found.` });
    }

    // Verify the issuing doctor exists
    const doctor = db.prepare("SELECT id FROM doctors WHERE id = ?").get(issuedBy);
    if (!doctor) {
      return res.status(404).json({ error: `Doctor ${issuedBy} not found.` });
    }

    db.prepare(`
      INSERT INTO prescriptions (prescriptionId, patientId, medication, status, issuedBy)
      VALUES (?, ?, ?, ?, ?)
    `).run(prescriptionId, patientId, medication, status || "pending_at_pharmacy", issuedBy);

    const inserted = db
      .prepare("SELECT * FROM prescriptions WHERE prescriptionId = ?")
      .get(prescriptionId);

    return res.status(201).json(inserted);
  } catch (err) {
    if (err.message.includes("UNIQUE constraint")) {
      return res.status(409).json({ error: `Prescription ${prescriptionId} already exists.` });
    }
    console.error("[POST /api/patients/:id/prescription]", err.message);
    return res.status(500).json({ error: "Failed to create prescription." });
  }
});

// ── Health check ────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ─────────────────────────────────────────────────────────────
//  4. Bootstrap
// ─────────────────────────────────────────────────────────────
function bootstrap() {
  createTables();
  seedDatabase();
  console.log("✔  Database tables created & seeded.");

  app.listen(PORT, () => {
    console.log(`🏥  Hospital Queue API running → http://localhost:${PORT}`);
    console.log(`   Master endpoint → http://localhost:${PORT}/api/hospital`);
  });
}

bootstrap();

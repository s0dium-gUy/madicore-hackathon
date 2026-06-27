// ─────────────────────────────────────────────────────────────
//  seed.js — Populate MongoDB with initial mock data
//  Usage: node seed.js   (or: npm run seed from root)
// ─────────────────────────────────────────────────────────────

// Resolve modules from backend's node_modules
const path = require("path");
module.paths.unshift(path.join(__dirname, "backend", "node_modules"));

require("dotenv").config();
const mongoose = require("mongoose");
const Doctor = require("./backend/models/Doctor");
const Patient = require("./backend/models/Patient");
const PastRecord = require("./backend/models/PastRecord");
const Prescription = require("./backend/models/Prescription");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✔  Connected to MongoDB for seeding.");

    // Clear existing data
    await Promise.all([
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      PastRecord.deleteMany({}),
      Prescription.deleteMany({}),
    ]);
    console.log("✔  Cleared existing collections.");

    // ── Doctors ──
    await Doctor.insertMany([
      {
        id: "DOC-101",
        name: "Dr. Sharma",
        specialization: "General Medicine",
        status: "available",
        statusLastUpdated: new Date("2026-06-27T10:00:00Z"),
        availabilitySchedule: "10:00-13:00, 14:00-18:00",
        currentPatientCount: 2,
      },
      {
        id: "DOC-102",
        name: "Dr. Patel",
        specialization: "Orthopedics",
        status: "on_break",
        statusLastUpdated: new Date("2026-06-27T12:30:00Z"),
        availabilitySchedule: "09:00-12:00",
        currentPatientCount: 0,
      },
    ]);
    console.log("✔  Seeded 2 doctors.");

    // ── Patients ──
    await Patient.create({
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
    console.log("✔  Seeded 1 patient.");

    // ── Past Records ──
    await PastRecord.create({
      patientId: "PAT-001",
      date: "2025-11-15",
      diagnosis: "Viral Infection",
      notes: "Cleared up after 3 days",
    });
    console.log("✔  Seeded 1 past record.");

    // ── Prescriptions ──
    await Prescription.create({
      prescriptionId: "RX-992",
      patientId: "PAT-001",
      medication: "Paracetamol 500mg",
      status: "pending_at_pharmacy",
      issuedBy: "DOC-101",
    });
    console.log("✔  Seeded 1 prescription.");

    console.log("\n🎉  Database seeding complete!");
  } catch (err) {
    console.error("✖  Seeding failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("✔  Disconnected from MongoDB.");
  }
}

seed();

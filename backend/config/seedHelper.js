const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const PastRecord = require("../models/PastRecord");
const Prescription = require("../models/Prescription");

async function seedDatabase() {
  try {
    // Clear existing data
    await Promise.all([
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      PastRecord.deleteMany({}),
      Prescription.deleteMany({}),
    ]);

    // Doctors
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

    // Patients
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

    // Past Records
    await PastRecord.create({
      patientId: "PAT-001",
      date: "2025-11-15",
      diagnosis: "Viral Infection",
      notes: "Cleared up after 3 days",
    });

    // Prescriptions
    await Prescription.create({
      prescriptionId: "RX-992",
      patientId: "PAT-001",
      medication: "Paracetamol 500mg",
      status: "pending_at_pharmacy",
      issuedBy: "DOC-101",
    });

    console.log("✔  Database successfully seeded with mock data!");
  } catch (err) {
    console.error("✖  Auto-seeding failed:", err.message);
  }
}

module.exports = seedDatabase;

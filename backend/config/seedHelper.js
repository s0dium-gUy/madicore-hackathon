const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const PastRecord = require("../models/PastRecord");
const Prescription = require("../models/Prescription");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const bcrypt = require("bcryptjs");

async function seedDatabase() {
  try {
    // Clear existing data
    await Promise.all([
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      PastRecord.deleteMany({}),
      Prescription.deleteMany({}),
      User.deleteMany({}),
      Appointment.deleteMany({}),
    ]);

    const salt = await bcrypt.genSalt(10);
    const doctorPassword = await bcrypt.hash("madicore123", salt);
    const adminPassword = await bcrypt.hash("admin123", salt);
    const patientPassword = await bcrypt.hash("patient123", salt);

    // Users
    await User.insertMany([
      {
        email: "admin@madicore.com",
        password: adminPassword,
        name: "Riya Kapoor",
        role: "admin",
      },
      {
        email: "doctor@madicore.com",
        password: doctorPassword,
        name: "Dr. Sharma",
        role: "doctor",
        referenceId: "DOC-101",
      },
      {
        email: "naman@madicore.com",
        password: patientPassword,
        name: "Naman Gabbur",
        role: "patient",
        referenceId: "PAT-001",
      },
    ]);

    // Doctors
    await Doctor.insertMany([
      {
        id: "DOC-101",
        name: "Dr. Sharma",
        specialization: "General Medicine",
        status: "available",
        statusLastUpdated: new Date("2026-06-27T10:00:00Z"),
        availability: [],
        currentPatientCount: 0,
      },
      {
        id: "DOC-102",
        name: "Dr. Patel",
        specialization: "Orthopedics",
        status: "on_break",
        statusLastUpdated: new Date("2026-06-27T12:30:00Z"),
        availability: [],
        currentPatientCount: 0,
      },
    ]);

    // Patients
    await Patient.create({
      id: "PAT-001",
      name: "Naman Gabbur",
      tokenNumber: "T-01",
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

    console.log("✔  Database successfully seeded with mock data (including Appointments)!");
  } catch (err) {
    console.error("✖  Auto-seeding failed:", err.message);
  }
}

module.exports = seedDatabase;

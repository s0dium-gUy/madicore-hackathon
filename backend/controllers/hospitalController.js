// ── Hospital Controller ─────────────────────────────────────
// Master endpoint that returns full hospital state

const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const PastRecord = require("../models/PastRecord");
const Prescription = require("../models/Prescription");

exports.getAll = async (req, res) => {
  try {
    const Appointment = require("../models/Appointment");
    // Only return active data for Admin dashboard (excluding past records)
    const [doctors, patients, currentPrescriptions, appointments] = await Promise.all([
      Doctor.find({}).lean(),
      Patient.find({}).lean(),
      Prescription.find({ status: { $ne: 'completed' } }, "prescriptionId patientId medication status issuedBy -_id").lean(),
      Appointment.find({ status: { $ne: 'cancelled' } }).lean()
    ]);

    return res.json({ doctors: sanitize(doctors), patients: sanitize(patients), currentPrescriptions, appointments: sanitize(appointments) });
  } catch (err) {
    console.error("[GET /api/hospital]", err.message);
    return res.status(500).json({ error: "Failed to fetch hospital data." });
  }
};

// Strip Mongoose internals (_id, __v, timestamps) from top-level docs
function sanitize(docs) {
  return docs.map(({ _id, __v, createdAt, updatedAt, ...rest }) => rest);
}

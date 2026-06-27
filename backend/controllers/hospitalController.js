// ── Hospital Controller ─────────────────────────────────────
// Master endpoint that returns full hospital state

const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const PastRecord = require("../models/PastRecord");
const Prescription = require("../models/Prescription");

exports.getAll = async (_req, res) => {
  try {
    const [doctors, patients, pastRecords, currentPrescriptions] = await Promise.all([
      Doctor.find({}).lean(),
      Patient.find({}).lean(),
      PastRecord.find({}, "patientId date diagnosis notes -_id").lean(),
      Prescription.find({}, "prescriptionId patientId medication status issuedBy -_id").lean(),
    ]);

    return res.json({ doctors: sanitize(doctors), patients: sanitize(patients), pastRecords, currentPrescriptions });
  } catch (err) {
    console.error("[GET /api/hospital]", err.message);
    return res.status(500).json({ error: "Failed to fetch hospital data." });
  }
};

// Strip Mongoose internals (_id, __v, timestamps) from top-level docs
function sanitize(docs) {
  return docs.map(({ _id, __v, createdAt, updatedAt, ...rest }) => rest);
}

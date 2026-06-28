// ── Hospital Controller ─────────────────────────────────────
// Master endpoint that returns full hospital state

const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const PastRecord = require("../models/PastRecord");
const Prescription = require("../models/Prescription");

exports.getAll = async (req, res) => {
  try {
    const Appointment = require("../models/Appointment");

    if (req.user.role === 'doctor') {
      const doctorId = req.user.referenceId;
      
      // Find appointments for this doctor
      const appointments = await Appointment.find({ doctorId, status: { $ne: 'cancelled' } }).lean();
      
      // Get unique patient IDs from those appointments
      const patientIds = [...new Set(appointments.map(a => a.patientId))];
      
      // Find those patients
      const patients = await Patient.find({ id: { $in: patientIds } }).lean();
      
      // Find prescriptions issued by this doctor
      const currentPrescriptions = await Prescription.find({ 
        issuedBy: doctorId, 
        status: { $ne: 'completed' } 
      }, "prescriptionId patientId medication status issuedBy -_id").lean();
      
      // Find the doctor's profile
      const doctors = await Doctor.find({ id: doctorId }).lean();
      
      return res.json({ 
        doctors: sanitize(doctors), 
        patients: sanitize(patients), 
        currentPrescriptions, 
        appointments: sanitize(appointments) 
      });
    }

    // Default admin/patient behavior
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

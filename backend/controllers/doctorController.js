// ── Doctor Controller ───────────────────────────────────────

const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

const VALID_STATUSES = ["available", "on_break", "unavailable"];

// GET /api/doctors
exports.listDoctors = async (_req, res) => {
  try {
    const doctors = await Doctor.find({}).lean();
    return res.json(doctors.map(sanitize));
  } catch (err) {
    console.error("[GET /api/doctors]", err.message);
    return res.status(500).json({ error: "Failed to fetch doctors." });
  }
};

// GET /api/doctors/:id/queue
exports.getDoctorQueue = async (req, res) => {
  try {
    let targetDoctorId = req.params.id;
    
    // Strict RBAC: Doctors can only view their own queue
    if (req.user.role === 'doctor') {
      if (req.user.referenceId !== targetDoctorId) {
        return res.status(403).json({ error: "Access denied. You can only view your own queue." });
      }
    }

    const doctor = await Doctor.findOne({ id: targetDoctorId }).lean();
    if (!doctor) return res.status(404).json({ error: "Doctor not found." });

    const queue = await Patient.find({
      assignedDoctorId: targetDoctorId,
      queueStatus: { $in: ["waiting", "in_consultation"] },
    })
      .sort({ bookedTimeSlot: 1 })
      .lean();

    return res.json(queue.map(sanitize));
  } catch (err) {
    console.error("[GET /api/doctors/:id/queue]", err.message);
    return res.status(500).json({ error: "Failed to fetch doctor queue." });
  }
};

// PATCH /api/doctors/:id/status
exports.updateStatus = async (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: "Missing required field: status" });
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
  }

  try {
    const doctor = await Doctor.findOneAndUpdate(
      { id: req.params.id },
      { status, statusLastUpdated: new Date() },
      { new: true, lean: true }
    );
    if (!doctor) return res.status(404).json({ error: `Doctor ${req.params.id} not found.` });
    return res.json(sanitize(doctor));
  } catch (err) {
    console.error("[PATCH /api/doctors/:id/status]", err.message);
    return res.status(500).json({ error: "Failed to update doctor status." });
  }
};

// PUT /api/doctors/availability
exports.updateAvailability = async (req, res) => {
  const { availability } = req.body || {};
  
  // RBAC: Only doctor can update their own schedule
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: "Only doctors can update their availability." });
  }

  const doctorId = req.user.referenceId;

  if (!Array.isArray(availability)) {
    return res.status(400).json({ error: "availability must be an array of slot configurations." });
  }

  // Set today's boundary (midnight local time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const day of availability) {
    const [year, month, d] = day.date.split('-');
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(d));
    if (targetDate < today) {
      return res.status(400).json({ message: "Cannot set availability for a past date." });
    }
  }

  try {
    const doctor = await Doctor.findOneAndUpdate(
      { id: doctorId },
      { availability },
      { new: true, lean: true }
    );
    if (!doctor) return res.status(404).json({ error: `Doctor profile not found.` });

    // Cascade Delete: Completely clear existing bookings when a doctor modifies their schedule for a given date
    const Appointment = Patient.model("Appointment");
    for (const day of availability) {
      // Find appointments that will be wiped
      const affectedApts = await Appointment.find({ doctorId, date: day.date });
      if (affectedApts.length > 0) {
        await Appointment.deleteMany({ doctorId, date: day.date });
        
        // Broadcast cancellation to affected patients
        const io = req.app.get('io');
        if (io) {
          for (const apt of affectedApts) {
            io.to(apt.patientId).emit('appointmentCancelledByDoctor', { date: day.date, timeSlot: apt.timeSlot });
          }
        }
      }
    }

    return res.json(sanitize(doctor));
  } catch (err) {
    console.error("[PUT /api/doctors/availability]", err.message);
    return res.status(500).json({ error: "Failed to update availability." });
  }
};

exports.getPatientPrescriptions = async (req, res) => {
  try {
    const Prescription = require("../models/Prescription");
    const { patientId } = req.params;
    const doctorId = req.user.referenceId;

    const prescriptions = await Prescription.find({
      patientId,
      issuedBy: doctorId
    }).lean();

    return res.json(prescriptions);
  } catch (err) {
    console.error("[GET /api/doctors/patients/:patientId/prescriptions]", err.message);
    return res.status(500).json({ error: "Failed to fetch patient prescriptions." });
  }
};

function sanitize({ _id, __v, createdAt, updatedAt, ...rest }) {
  return rest;
}

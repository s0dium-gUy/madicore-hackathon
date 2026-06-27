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
    const doctor = await Doctor.findOne({ id: req.params.id }).lean();
    if (!doctor) return res.status(404).json({ error: "Doctor not found." });

    const queue = await Patient.find({
      assignedDoctorId: req.params.id,
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

// PATCH /api/doctors/:id/availability
exports.updateAvailability = async (req, res) => {
  const { availabilitySchedule } = req.body || {};
  if (!availabilitySchedule) return res.status(400).json({ error: "availabilitySchedule is required." });

  try {
    const doctor = await Doctor.findOneAndUpdate(
      { id: req.params.id },
      { availabilitySchedule },
      { new: true, lean: true }
    );
    if (!doctor) return res.status(404).json({ error: `Doctor ${req.params.id} not found.` });
    return res.json(sanitize(doctor));
  } catch (err) {
    console.error("[PATCH /api/doctors/:id/availability]", err.message);
    return res.status(500).json({ error: "Failed to update availability." });
  }
};

function sanitize({ _id, __v, createdAt, updatedAt, ...rest }) {
  return rest;
}

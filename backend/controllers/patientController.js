// ── Patient Controller ──────────────────────────────────────

const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const PastRecord = require("../models/PastRecord");
const Prescription = require("../models/Prescription");

const VALID_QUEUE = ["waiting", "in_consultation", "completed", "no_show"];

// ── Helpers ─────────────────────────────────────────────────

function sanitize({ _id, __v, createdAt, updatedAt, ...rest }) {
  return rest;
}

async function buildQueueSummary(patient) {
  const doctor = await Doctor.findOne({ id: patient.assignedDoctorId }).lean();
  const queue = await Patient.find({
    assignedDoctorId: patient.assignedDoctorId,
    queueStatus: { $in: ["waiting", "in_consultation"] },
  })
    .sort({ bookedTimeSlot: 1 })
    .lean();

  const position = queue.findIndex((e) => e.id === patient.id) + 1;
  return {
    id: patient.id,
    name: patient.name,
    tokenNumber: patient.tokenNumber,
    position: position > 0 ? position : 1,
    queueStatus: patient.queueStatus,
    assignedDoctorId: patient.assignedDoctorId,
    bookedTimeSlot: patient.bookedTimeSlot,
    doctorName: doctor ? doctor.name : null,
  };
}

// ── Route Handlers ──────────────────────────────────────────

// GET /api/patients/:id/queue
exports.getQueue = async (req, res) => {
  try {
    const patient = await Patient.findOne({ id: req.params.id }).lean();
    if (!patient) return res.status(404).json({ error: "Patient not found." });
    return res.json(await buildQueueSummary(patient));
  } catch (err) {
    console.error("[GET /api/patients/:id/queue]", err.message);
    return res.status(500).json({ error: "Failed to fetch queue." });
  }
};

// GET /api/patients/:id/medical-history
exports.getMedicalHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({ id: req.params.id }).lean();
    if (!patient) return res.status(404).json({ error: "Patient not found." });

    const [pastRecords, currentPrescriptions] = await Promise.all([
      PastRecord.find({ patientId: req.params.id }).lean(),
      Prescription.find({ patientId: req.params.id }).lean(),
    ]);

    return res.json({ patient: sanitize(patient), pastRecords, currentPrescriptions });
  } catch (err) {
    console.error("[GET /api/patients/:id/medical-history]", err.message);
    return res.status(500).json({ error: "Failed to fetch medical history." });
  }
};

// GET /api/patients/:id/stats
exports.getStats = async (req, res) => {
  try {
    const patient = await Patient.findOne({ id: req.params.id }).lean();
    if (!patient) return res.status(404).json({ error: "Patient not found." });

    const [pastRecords, prescriptions] = await Promise.all([
      PastRecord.find({ patientId: req.params.id }).lean(),
      Prescription.find({ patientId: req.params.id }).lean(),
    ]);

    const queue = await buildQueueSummary(patient);
    return res.json({ ...sanitize(patient), queue, pastRecords, prescriptions });
  } catch (err) {
    console.error("[GET /api/patients/:id/stats]", err.message);
    return res.status(500).json({ error: "Failed to fetch patient stats." });
  }
};

// POST /api/patients/:id/book-slot
exports.bookSlot = async (req, res) => {
  const { doctorId, timeSlot } = req.body || {};
  if (!doctorId || !timeSlot) {
    return res.status(400).json({ error: "doctorId and timeSlot are required." });
  }

  try {
    const patient = await Patient.findOne({ id: req.params.id });
    const doctor = await Doctor.findOne({ id: doctorId });
    if (!patient || !doctor) return res.status(404).json({ error: "Patient or doctor not found." });

    // Decrement old doctor's count if reassigning
    if (patient.assignedDoctorId && patient.assignedDoctorId !== doctorId) {
      await Doctor.findOneAndUpdate(
        { id: patient.assignedDoctorId },
        { $inc: { currentPatientCount: -1 } }
      );
    }

    patient.assignedDoctorId = doctorId;
    patient.bookedTimeSlot = timeSlot;
    patient.queueStatus = "waiting";
    await patient.save();

    await Doctor.findOneAndUpdate({ id: doctorId }, { $inc: { currentPatientCount: 1 } });

    return res.json(sanitize(patient.toObject()));
  } catch (err) {
    console.error("[POST /api/patients/:id/book-slot]", err.message);
    return res.status(500).json({ error: "Failed to book slot." });
  }
};

// POST /api/patients/:id/fast-track
exports.fastTrack = async (req, res) => {
  try {
    const patient = await Patient.findOne({ id: req.params.id });
    if (!patient) return res.status(404).json({ error: "Patient not found." });

    // Find least-busy available doctor
    const doctor = await Doctor.findOne({ status: "available" }).sort({ currentPatientCount: 1 }).lean();
    if (!doctor) return res.status(404).json({ error: "No doctor available." });

    // Decrement old doctor if reassigning
    if (patient.assignedDoctorId && patient.assignedDoctorId !== doctor.id) {
      await Doctor.findOneAndUpdate(
        { id: patient.assignedDoctorId },
        { $inc: { currentPatientCount: -1 } }
      );
    }

    patient.assignedDoctorId = doctor.id;
    patient.bookedTimeSlot = "Immediate allocation";
    patient.queueStatus = "waiting";
    await patient.save();

    await Doctor.findOneAndUpdate({ id: doctor.id }, { $inc: { currentPatientCount: 1 } });

    return res.json({ patient: sanitize(patient.toObject()), doctor: sanitize(doctor) });
  } catch (err) {
    console.error("[POST /api/patients/:id/fast-track]", err.message);
    return res.status(500).json({ error: "Failed to fast-track." });
  }
};

// PATCH /api/patients/:id/queue
exports.updateQueue = async (req, res) => {
  const { queueStatus } = req.body || {};
  if (!queueStatus) return res.status(400).json({ error: "Missing required field: queueStatus" });
  if (!VALID_QUEUE.includes(queueStatus)) {
    return res.status(400).json({ error: `Invalid queueStatus. Must be one of: ${VALID_QUEUE.join(", ")}` });
  }

  try {
    const patient = await Patient.findOneAndUpdate(
      { id: req.params.id },
      { queueStatus },
      { new: true, lean: true }
    );
    if (!patient) return res.status(404).json({ error: `Patient ${req.params.id} not found.` });

    if ((queueStatus === "completed" || queueStatus === "no_show") && patient.assignedDoctorId) {
      await Doctor.findOneAndUpdate(
        { id: patient.assignedDoctorId },
        { $inc: { currentPatientCount: -1 } }
      );
    }

    return res.json(sanitize(patient));
  } catch (err) {
    console.error("[PATCH /api/patients/:id/queue]", err.message);
    return res.status(500).json({ error: "Failed to update queue status." });
  }
};

// PATCH /api/patients/:id/complete
exports.markComplete = async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { id: req.params.id },
      { queueStatus: "completed" },
      { new: true, lean: true }
    );
    if (!patient) return res.status(404).json({ error: "Patient not found." });

    if (patient.assignedDoctorId) {
      await Doctor.findOneAndUpdate(
        { id: patient.assignedDoctorId },
        { $inc: { currentPatientCount: -1 } }
      );
    }

    return res.json(sanitize(patient));
  } catch (err) {
    console.error("[PATCH /api/patients/:id/complete]", err.message);
    return res.status(500).json({ error: "Failed to mark complete." });
  }
};

// POST /api/patients/:id/prescription
exports.createPrescription = async (req, res) => {
  const { prescriptionId, medication, issuedBy, status } = req.body || {};
  if (!prescriptionId || !medication || !issuedBy) {
    return res.status(400).json({ error: "Missing required fields: prescriptionId, medication, issuedBy" });
  }

  try {
    const [patient, doctor] = await Promise.all([
      Patient.findOne({ id: req.params.id }).lean(),
      Doctor.findOne({ id: issuedBy }).lean(),
    ]);
    if (!patient || !doctor) return res.status(404).json({ error: "Patient or doctor not found." });

    const rx = await Prescription.create({
      prescriptionId,
      patientId: req.params.id,
      medication,
      status: status || "pending_at_pharmacy",
      issuedBy,
    });

    return res.status(201).json({
      prescriptionId: rx.prescriptionId,
      patientId: rx.patientId,
      medication: rx.medication,
      status: rx.status,
      issuedBy: rx.issuedBy,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `Prescription ${prescriptionId} already exists.` });
    }
    console.error("[POST /api/patients/:id/prescription]", err.message);
    return res.status(500).json({ error: "Failed to create prescription." });
  }
};

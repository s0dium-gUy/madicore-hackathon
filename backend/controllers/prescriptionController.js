const Prescription = require("../models/Prescription");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");

exports.createPrescription = async (req, res) => {
  const { prescriptionId, patientId, medication, status } = req.body || {};
  if (!prescriptionId || !patientId || !medication) {
    return res.status(400).json({ error: "Missing required fields: prescriptionId, patientId, medication" });
  }

  try {
    const doctorId = req.user.referenceId || req.user.id;
    
    const [patient, doctor] = await Promise.all([
      Patient.findOne({ id: patientId }).lean(),
      Doctor.findOne({ id: doctorId }).lean(),
    ]);

    if (!patient || !doctor) {
      return res.status(404).json({ error: "Patient or doctor not found." });
    }

    const rx = await Prescription.create({
      prescriptionId,
      patientId,
      medication,
      status: status || "pending_at_pharmacy",
      issuedBy: doctorId,
    });

    return res.status(201).json(rx);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `Prescription ${prescriptionId} already exists.` });
    }
    console.error("[POST /api/prescriptions] Error:", err.message);
    return res.status(500).json({ error: "Failed to create prescription." });
  }
};

exports.updatePrescription = async (req, res) => {
  const { medication, status } = req.body || {};

  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ message: "Prescription record not found." });
    
    // Safety validation rule to confirm that the requesting doctor matches doctorId
    if (prescription.doctorId.toString() !== req.user.id && prescription.doctorId.toString() !== req.user.referenceId) {
        return res.status(403).json({ message: "Access denied. Unauthorized script modification." });
    }

    if (medication) prescription.medication = medication;
    if (status) prescription.status = status;
    await prescription.save();

    return res.json(prescription);
  } catch (err) {
    console.error("[PUT /api/prescriptions/:id] Error:", err.message);
    return res.status(500).json({ error: "Failed to update prescription." });
  }
};

exports.deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ message: "Prescription record not found." });

    // Safety validation rule to confirm that the requesting doctor matches doctorId
    if (prescription.doctorId.toString() !== req.user.id && prescription.doctorId.toString() !== req.user.referenceId) {
        return res.status(403).json({ message: "Access denied. Unauthorized script modification." });
    }

    await Prescription.findByIdAndDelete(req.params.id);
    return res.json({ message: "Prescription deleted successfully." });
  } catch (err) {
    console.error("[DELETE /api/prescriptions/:id] Error:", err.message);
    return res.status(500).json({ error: "Failed to delete prescription." });
  }
};

const mongoose = require("mongoose");

const pastRecordSchema = new mongoose.Schema(
  {
    patientId: { type: String, ref: "Patient", required: true },
    date: { type: String, required: true },
    diagnosis: { type: String, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PastRecord", pastRecordSchema);

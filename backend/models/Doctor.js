const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    status: {
      type: String,
      enum: ["available", "on_break", "unavailable"],
      default: "available",
    },
    statusLastUpdated: { type: Date, default: Date.now },
    availabilitySchedule: { type: String, required: true },
    currentPatientCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);

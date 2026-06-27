const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: { type: String, required: true, unique: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    timeSlot: { type: String, required: true }, // "09:00"
    doctorId: { type: String, ref: "Doctor", required: true },
    patientId: { type: String, ref: "Patient", required: true },
    status: {
      type: String,
      enum: ["booked", "completed", "cancelled"],
      default: "booked",
    },
  },
  { timestamps: true }
);

// Compound index to guarantee a doctor cannot be double-booked for the exact date & timeSlot
appointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1 }, { unique: true });

// Compound index to guarantee a patient can only book 1 slot per day globally
appointmentSchema.index({ patientId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Appointment", appointmentSchema);

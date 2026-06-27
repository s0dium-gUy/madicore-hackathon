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
    availability: [{
      date: { type: String, required: true }, // Format: YYYY-MM-DD
      slots: [{
        startTime: String, // e.g., "09:00"
        endTime: String,   // e.g., "17:00"
        duration: String   // e.g., "30m"
      }]
    }],
    currentPatientCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);

const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    tokenNumber: { type: String, required: true, unique: true },
    queueStatus: {
      type: String,
      enum: ["waiting", "in_consultation", "completed", "no_show"],
      default: "waiting",
    },
    routingPreference: { type: String, default: "fastest_available" },
    assignedDoctorId: { type: String, ref: "Doctor", default: null },
    bookedTimeSlot: { type: String, default: null },
    age: { type: Number },
    bloodGroup: { type: String },
    bp: { type: String },
    temp: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);

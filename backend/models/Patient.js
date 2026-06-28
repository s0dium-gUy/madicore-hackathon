const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    name: { type: String },
    fullName: { type: String, required: true },
    tokenNumber: { type: String, unique: true },
    queueStatus: {
      type: String,
      enum: ["waiting", "in_consultation", "completed", "no_show"],
      default: "waiting",
    },
    routingPreference: { type: String, default: "fastest_available" },
    assignedDoctorId: { type: String, ref: "Doctor", default: null },
    bookedTimeSlot: { type: String, default: null },
    age: { type: Number, required: true },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    bloodGroup: { type: String },
    bp: { type: String },
    temp: { type: String },
  },
  { timestamps: true }
);

patientSchema.pre("save", function (next) {
  if (!this.id) {
    this.id = `PAT-${Math.floor(10000 + Math.random() * 90000)}`;
  }
  if (!this.tokenNumber) {
    this.tokenNumber = `T-${Math.floor(10 + Math.random() * 90)}`;
  }
  if (!this.name && this.fullName) {
    this.name = this.fullName;
  }
  next();
});

module.exports = mongoose.model("Patient", patientSchema);

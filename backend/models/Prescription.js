const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: { type: String, required: true, unique: true },
    patientId: { type: String, ref: "Patient", required: true },
    medication: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending_at_pharmacy", "dispensed", "cancelled"],
      default: "pending_at_pharmacy",
    },
    issuedBy: { type: String, ref: "Doctor", required: true },
  },
  { timestamps: true }
);

prescriptionSchema.virtual("doctorId").get(function () {
  return this.issuedBy;
});
prescriptionSchema.set("toJSON", { virtuals: true });
prescriptionSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Prescription", prescriptionSchema);

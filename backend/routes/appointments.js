const router = require("express").Router();
const ctrl = require("../controllers/appointmentController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// All appointment routes require authentication
router.use(protect);

// Patients can book appointments
router.post("/book", authorizeRoles("patient"), ctrl.bookAppointment);

// Patients can cancel appointments
router.delete("/:id/cancel", authorizeRoles("patient"), ctrl.cancelAppointment);

// Anyone (logged in) can view available slots for a doctor
router.get("/doctors/:id/available-slots", ctrl.getAvailableSlots);

// Doctors can view their booked agenda
router.get("/doctor-agenda", authorizeRoles("doctor"), ctrl.getDoctorAgenda);

// Admins can view the master schedule
router.get("/schedule", authorizeRoles("admin"), ctrl.getMasterSchedule);

module.exports = router;

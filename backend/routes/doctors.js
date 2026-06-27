const router = require("express").Router();
const ctrl = require("../controllers/doctorController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// All doctor routes require authentication
router.use(protect);

router.get("/", authorizeRoles("admin", "patient", "doctor"), ctrl.listDoctors);
router.get("/:id/queue", authorizeRoles("doctor", "admin"), ctrl.getDoctorQueue);

// Aliases to match specific routing conventions
const authenticateUser = protect;
const authorizeDoctor = authorizeRoles("doctor");
const updateAvailability = ctrl.updateAvailability;

// Doctor only actions
router.patch("/:id/status", authorizeRoles("doctor", "admin"), ctrl.updateStatus);
router.put("/availability", authenticateUser, authorizeDoctor, updateAvailability);

module.exports = router;

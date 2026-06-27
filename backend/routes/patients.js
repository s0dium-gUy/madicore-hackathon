const router = require("express").Router();
const ctrl = require("../controllers/patientController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// All patient routes require authentication
router.use(protect);

router.get("/:id/queue", authorizeRoles("patient", "doctor", "admin"), ctrl.getQueue);
router.get("/:id/medical-history", authorizeRoles("patient", "doctor", "admin"), ctrl.getMedicalHistory);
router.get("/:id/stats", authorizeRoles("patient", "doctor", "admin"), ctrl.getStats);

// Patient only actions
router.post("/:id/book-slot", authorizeRoles("patient", "admin"), ctrl.bookSlot);
router.post("/:id/fast-track", authorizeRoles("patient", "admin"), ctrl.fastTrack);

// Doctor only actions
router.patch("/:id/queue", authorizeRoles("doctor", "admin"), ctrl.updateQueue);
router.patch("/:id/complete", authorizeRoles("doctor", "admin"), ctrl.markComplete);
router.post("/:id/prescription", authorizeRoles("doctor", "admin"), ctrl.createPrescription);

module.exports = router;

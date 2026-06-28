const router = require("express").Router();
const ctrl = require("../controllers/prescriptionController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Require authentication for all routes
router.use(protect);

router.post("/", authorizeRoles("doctor"), ctrl.createPrescription);
router.put("/:id", authorizeRoles("doctor"), ctrl.updatePrescription);
router.delete("/:id", authorizeRoles("doctor"), ctrl.deletePrescription);

module.exports = router;

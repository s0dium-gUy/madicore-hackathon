const router = require("express").Router();
const ctrl = require("../controllers/patientController");

router.get("/:id/queue", ctrl.getQueue);
router.get("/:id/medical-history", ctrl.getMedicalHistory);
router.get("/:id/stats", ctrl.getStats);
router.post("/:id/book-slot", ctrl.bookSlot);
router.post("/:id/fast-track", ctrl.fastTrack);
router.patch("/:id/queue", ctrl.updateQueue);
router.patch("/:id/complete", ctrl.markComplete);
router.post("/:id/prescription", ctrl.createPrescription);

module.exports = router;

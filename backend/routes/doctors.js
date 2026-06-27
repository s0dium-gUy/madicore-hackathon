const router = require("express").Router();
const ctrl = require("../controllers/doctorController");

router.get("/", ctrl.listDoctors);
router.get("/:id/queue", ctrl.getDoctorQueue);
router.patch("/:id/status", ctrl.updateStatus);
router.patch("/:id/availability", ctrl.updateAvailability);

module.exports = router;

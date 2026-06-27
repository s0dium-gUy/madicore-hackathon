const router = require("express").Router();
const { getAll } = require("../controllers/hospitalController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Master endpoint for dashboard
router.get("/", protect, authorizeRoles("admin", "doctor", "patient"), getAll);

module.exports = router;

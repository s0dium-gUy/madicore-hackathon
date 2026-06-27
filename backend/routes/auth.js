const router = require("express").Router();
const { login, register, getMe, doctorSignup } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);

// Doctor Signup Hookup with Multer
router.post("/doctor/signup", upload, doctorSignup);

module.exports = router;

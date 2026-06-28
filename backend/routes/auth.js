const router = require("express").Router();
const { login, register, getMe, doctorSignup, patientSignup, verifyOtp } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);

// Doctor Signup Hookup with Multer
router.post("/doctor/signup", upload, doctorSignup);

// Patient Onboarding & OTP verification
router.post("/auth/patient/signup", patientSignup);
router.post("/auth/verify-otp", verifyOtp);

module.exports = router;

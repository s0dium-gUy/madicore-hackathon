// ── Auth Controller ─────────────────────────────────────────
// Hardcoded login for hackathon prototype

const VALID_USERS = {
  "doctor@madicore.com": {
    password: "madicore123",
    name: "Dr. Aarav Sharma",
    role: "Medical Officer",
  },
  "admin@madicore.com": {
    password: "admin123",
    name: "Riya Kapoor",
    role: "Hospital Admin",
  },
};

exports.login = (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Please enter your email and password." });
  }

  const user = VALID_USERS[email.toLowerCase()];

  if (!user || user.password !== password) {
    return res.status(401).json({
      error: "Invalid credentials. Try doctor@madicore.com / madicore123.",
    });
  }

  return res.json({
    message: "Login successful",
    user: { email, name: user.name, role: user.role },
  });
};

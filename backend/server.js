require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

// ─────────────────────────────────────────────────────────────
//  Hospital Queue Management System — server.js
//  Stack: Node.js · Express · MongoDB (Mongoose)
// ─────────────────────────────────────────────────────────────

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const io = new Server(server, {
  cors: { origin: "*" }
});
app.set("io", io);

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error: No token provided"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    let user = await User.findById(decoded.id).lean();
    if (!user) {
      const Patient = require("./models/Patient");
      const patient = await Patient.findById(decoded.id).lean();
      if (patient) {
        user = {
          _id: patient._id,
          id: patient._id,
          name: patient.fullName,
          role: 'patient',
          referenceId: patient.id
        };
      }
    }
    if (!user) return next(new Error("Authentication error: User not found"));
    
    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  // Automatically place the incoming connection into a tab-isolated room
  if (socket.user && socket.user.referenceId) {
    socket.join(socket.user.referenceId);
  }
});

const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.use("/api", require("./routes/auth"));
app.use("/api/hospital", require("./routes/hospital"));
app.use("/api/doctors", require("./routes/doctors"));
app.use("/api/patients", require("./routes/patients"));
app.use("/api/appointments", require("./routes/appointments"));
app.use("/api/prescriptions", require("./routes/prescriptions"));

// ── Health Check ────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ── Serve React build in production ─────────────────────────
const frontendDist = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

// ── Bootstrap ───────────────────────────────────────────────
async function bootstrap() {
  const isInMemory = await connectDB();

  if (isInMemory) {
    console.log("Auto-seeding in-memory database...");
    const seedDatabase = require("./config/seedHelper");
    await seedDatabase();
  }

  server.listen(PORT, () => {
    console.log(`🏥  Hospital Queue API running → http://localhost:${PORT}`);
    console.log(`   Master endpoint → http://localhost:${PORT}/api/hospital`);
  });
}

if (require.main === module) {
  bootstrap();
}

module.exports = { app, server, io };

// ─────────────────────────────────────────────────────────────
//  Hospital Queue Management System — server.js
//  Stack: Node.js · Express · MongoDB (Mongoose)
// ─────────────────────────────────────────────────────────────

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.use("/api", require("./routes/auth"));
app.use("/api/hospital", require("./routes/hospital"));
app.use("/api/doctors", require("./routes/doctors"));
app.use("/api/patients", require("./routes/patients"));

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

  app.listen(PORT, () => {
    console.log(`🏥  Hospital Queue API running → http://localhost:${PORT}`);
    console.log(`   Master endpoint → http://localhost:${PORT}/api/hospital`);
  });
}

if (require.main === module) {
  bootstrap();
}

module.exports = { app };

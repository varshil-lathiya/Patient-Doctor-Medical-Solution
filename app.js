const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const { PORT } = process.env;
const { initCronJobs } = require("./utils/cron");

const receptRoutes = require("./routes/receptionist.route");
const doctorRoutes = require("./routes/doctor.route");
const adminRoutes = require("./routes/admin.route");
const patientRoutes = require("./routes/patient.route.js");
const authRoutes = require("./routes/auth.route");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// Global cache-control to prevent serving stale bfcache pages, specifically when using browser back button
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.use("/", authRoutes);
app.use("/doctor", doctorRoutes);
app.use("/receptionist", receptRoutes);
app.use("/patient", patientRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.render("pdms");
});

app.get("/session-expired", (req, res) => {
  res.render("auth/session_expired");
});

app.listen(PORT, (error) => {
  if (!error) {
    console.log(`✅ Server is running on port http://localhost:${PORT}`);
    initCronJobs(); // Initialize automated slot generation
  } else {
    console.log("❌ Error occurred, server can't start", error);
  }
});

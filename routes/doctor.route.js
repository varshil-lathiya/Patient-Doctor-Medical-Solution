const express = require("express");
const doctorController = require("../controller/doctor.controller");

const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

// Apply protection to all doctor routes
router.use(protect);
router.use(restrictTo("doctor"));

router.get("/dashboard", doctorController.doctorDashboard);
router.get('/patient_history/:patient_id/:slot_id', doctorController.patient_history);
router.get("/appoinments", doctorController.doctorAppoinmentPage);
router.get("/profilePage", doctorController.doctorProfile);
router.post("/set-availability", doctorController.setAvailability);
router.post("/record-consultation", doctorController.recordConsultation);
router.get("/leaves", doctorController.doctorLeavesPage);
router.post("/apply-leave", doctorController.applyLeave);
router.post("/update-profile", doctorController.updateDoctorProfile);

module.exports = router;

const express = require("express");
const receptionistController = require("../controller/receptionist.controller");

const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

// Apply protection to all receptionist routes
router.use(protect);
router.use(restrictTo("receptionist"));

router.get("/dashboard", receptionistController.receptionistDashboardPage);
router.get("/appointments", receptionistController.receptionistAppoinmentPage);
router.get("/doctors", receptionistController.receptionistDoctorPage);
router.get("/patients", receptionistController.receptionistPatientsPage);
const { upload } = require("../config/cloudinary.config");

router.get("/profile", receptionistController.receptionistProfilePage);
router.post("/update-profile", receptionistController.updateReceptionistProfile);
router.get("/addReport", receptionistController.addReportPage);
router.post("/book-appointment", receptionistController.bookAppointment);
router.post("/update-vitals", receptionistController.updateVitals);
router.post("/uploadReport", upload.single("report"), receptionistController.uploadReport);
router.post("/cancel-appointment", receptionistController.cancelAppointment);
router.post("/reschedule-appointment", receptionistController.rescheduleAppointment);
router.post("/start-consultation", receptionistController.startConsultation);
router.post("/verify-patient", receptionistController.verifyPatientByEmail);
router.post("/register-patient", receptionistController.registerPatient);
router.post("/update-patient", receptionistController.updatePatient);
router.get("/get-slots", receptionistController.getSlotsForReschedule);

router.get("/leaves", receptionistController.receptionistLeavesPage);
router.post("/apply-leave", receptionistController.applyLeave);
router.get('/department/:department', receptionistController.getDoctorsByDepartment);

module.exports = router;

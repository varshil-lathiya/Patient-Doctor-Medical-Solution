const express = require("express");
const patientController = require("../controller/patient.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { authRedirect } = require("../middleware/authRedirect.middleware");

const router = express.Router();

// Public routes
router.get("/login", authRedirect, patientController.patient_login);
router.get("/signup/email", authRedirect, patientController.patientSignupPageEmail);
router.post("/signup/emailVerification", patientController.patientEmailVerification);
router.get("/signup/otp_verifiaction_page", authRedirect, patientController.patientOtpVerifiactionPage);
router.post("/signup/otp_verification", patientController.patientOtpVerification);
router.get("/signup/registration_details", authRedirect, patientController.patientSignUpRegistrationPage);
router.post("/signup/insert_registration_details", patientController.insertPatientRegistrationDetails);
router.post("/login/emailVerification", patientController.loginPatientEmailVerification);
router.get("/login/otpVerificationPage", authRedirect, patientController.loginPatientOtpVerificationPage);
router.post("/login/otp_verification", patientController.loginPatientOtpVerification);

// Protected routes
router.use(protect);
router.use(restrictTo("patient"));

router.get("/dashboard", patientController.patientDashboardPage);
router.get("/profile", patientController.patientProfilePage);
router.post("/profile/update", patientController.updatePatientProfile);
router.get("/userdetails", patientController.getPatientDetails);

// Specialty & Doctors
router.get("/dashboard/department/:department", patientController.getDoctorsBySpecialty);
router.get("/get-slots", patientController.getAvailableSlots);

// Appointments
router.get("/appointments", patientController.patientAppoinmentPage);
router.post("/book-appointment", patientController.bookAppointment);
router.post("/create-checkout-session", patientController.createCheckoutSession);
router.get("/payment-success", patientController.paymentSuccess);
router.get("/payment-cancelled", patientController.paymentCancelled);
router.post("/cancel-appointment", patientController.cancelAppointment);
router.post("/reschedule-appointment", patientController.rescheduleAppointment);

// History & Feedback
router.get("/history", patientController.patientHistoryPage);
router.post("/rate-doctor", patientController.rateDoctor);

router.get("/logout", patientController.patientLogout);

module.exports = router;

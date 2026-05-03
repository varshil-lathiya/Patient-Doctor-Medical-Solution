const db = require("../config/db.config");
const mailSender = require("../utils/mail_sender");
const bcrypt = require("bcrypt");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const doctorPricing = require("../config/doctor_pricing");

// Function to generate OTP
function generateOTP(length = 6) {
  return Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
}

const patientDashboardPage = async (req, res) => {
  try {
    const patientId = req.user.id;

    // Get stats
    const [[{ upcomingCount }]] = await db.execute(
      `SELECT COUNT(*) as upcomingCount 
       FROM appointment_slots 
       WHERE patient_id = ? 
       AND status = 'is_occupied' 
       AND (slot_date > CURDATE() OR (slot_date = CURDATE() AND slot_start > CURTIME()))`,
      [patientId]
    );

    const [[{ visitsCount }]] = await db.execute(
      "SELECT COUNT(*) as visitsCount FROM consultation_records WHERE patient_id = ?",
      [patientId]
    );

    // Fetch emergency cancellations for dashboard alert
    const [emergencyCancellations] = await db.execute(
      `SELECT a.slot_date, a.slot_start, s.firstname as doc_first, s.lastname as doc_last
       FROM appointment_slots a
       JOIN staff s ON a.doctor_id = s.id
       WHERE a.patient_id = ? AND a.status = 'is_occupied' AND a.reason = 'Doctor on Emergency Leave' AND a.slot_date >= CURDATE()`,
      [patientId]
    );

    // Get specialties
    const [specialties] = await db.execute("SELECT DISTINCT department FROM doctor_details");

    res.render("patient/patient_dashboard", {
      user: req.user,
      stats: { upcomingCount, visitsCount },
      specialties,
      emergencyCancellations
    });
  } catch (error) {
    console.error("Patient dashboard error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const getDoctorsBySpecialty = async (req, res) => {
  try {
    const { department } = req.params;
    const now = new Date();
    const today = now.toLocaleDateString('en-CA');
    const nowTime = now.toTimeString().split(' ')[0];

    const [doctors] = await db.execute(`
      SELECT s.id, s.firstname, s.lastname, s.profile_pic, dd.department, dd.qualification, dd.experience, dd.rating_avg,
      CASE 
        WHEN (SELECT COUNT(*) FROM doctor_leaves WHERE doctor_id = s.id AND status = 'approved' AND ? BETWEEN from_date AND to_date) > 0 THEN 0
        ELSE (SELECT COUNT(*) FROM appointment_slots WHERE doctor_id = s.id AND status = 'is_available' AND (slot_date > ? OR (slot_date = ? AND slot_start >= ?)))
      END as available_slots
      FROM staff s
      JOIN doctor_details dd ON s.id = dd.doctor_id
      WHERE dd.department = ? AND s.role_id = 2 AND s.is_deleted = 0
    `, [today, today, today, nowTime, department]);

    res.render("patient/patient_department_doctor", {
      departmentName: department,
      doctors,
      user: req.user
    });
  } catch (error) {
    console.error("Get doctors by specialty error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const getAvailableSlots = async (req, res) => {
  try {
    const { doctor_id, date } = req.query;

    // Check if the doctor is on approved leave for this date
    const [leaves] = await db.execute(
      "SELECT id FROM doctor_leaves WHERE doctor_id = ? AND status = 'approved' AND ? BETWEEN from_date AND to_date",
      [doctor_id, date]
    );

    if (leaves.length > 0) {
      return res.json({ 
        success: true, 
        slots: [], 
        message: "Doctor is on leave for this date." 
      });
    }

    // Get current date in YYYY-MM-DD format
    const now = new Date();
    const today = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');

    let query = "SELECT id, slot_start, slot_end FROM appointment_slots WHERE doctor_id = ? AND slot_date = ? AND status = 'is_available'";
    let params = [doctor_id, date];

    // If the requested date is today, filter out slots that have passed
    if (date === today) {
      const cutoffTimeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      query += " AND slot_start >= ?";
      params.push(cutoffTimeStr);
    }

    const [slots] = await db.execute(query, params);
    res.json({ success: true, slots });
  } catch (error) {
    console.error("Get available slots error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const bookAppointment = async (req, res) => {
  try {
    const { slot_id } = req.body;
    const patientId = req.user.id;

    const [slot] = await db.execute("SELECT status FROM appointment_slots WHERE id = ?", [slot_id]);
    if (slot.length === 0 || slot[0].status !== 'is_available') {
      return res.status(400).json({ message: "Slot no longer available" });
    }

    await db.execute(
      "UPDATE appointment_slots SET patient_id = ?, status = 'is_occupied' WHERE id = ?",
      [patientId, slot_id]
    );

    res.json({ success: true, message: "Appointment booked successfully" });
  } catch (error) {
    console.error("Book appointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createCheckoutSession = async (req, res) => {
  try {
    const { slot_id, doctor_id, doctor_name } = req.body;
    const patientId = req.user.id;

    // Check for existing active appointment with this doctor
    const [existingAppt] = await db.execute(
      "SELECT id FROM appointment_slots WHERE patient_id = ? AND doctor_id = ? AND status IN ('is_occupied', 'is_in_process')",
      [patientId, doctor_id]
    );

    if (existingAppt.length > 0) {
      return res.status(400).json({ 
        message: "You already have an active appointment with this doctor. Please complete or cancel it before booking a new one." 
      });
    }

    // Get fixed token fee
    const price = doctorPricing.fee || 200;

    // Check slot availability
    const [slots] = await db.execute("SELECT * FROM appointment_slots WHERE id = ? AND status = 'is_available'", [slot_id]);
    if (slots.length === 0) {
      return res.status(400).json({ message: "Slot is no longer available" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Consultation with Dr. ${doctor_name}`,
              description: `Appointment Slot ID: ${slot_id}`,
            },
            unit_amount: price * 100, // Stripe expects amount in Rupees
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.protocol}://${req.get("host")}/patient/payment-success?session_id={CHECKOUT_SESSION_ID}&slot_id=${slot_id}`,
      cancel_url: `${req.protocol}://${req.get("host")}/patient/dashboard`,
      metadata: {
        slot_id: slot_id,
        patient_id: patientId,
        doctor_id: doctor_id
      }
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    res.status(500).json({ message: "Failed to create payment session" });
  }
};

const paymentSuccess = async (req, res) => {
  const { session_id, slot_id } = req.query;
  const patientId = req.user.id;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      // Finalize booking
      await db.execute(
        "UPDATE appointment_slots SET patient_id = ?, status = 'is_occupied' WHERE id = ?",
        [patientId, slot_id]
      );
      res.render("patient/payment_status", { success: true, message: "Payment successful! Your appointment is booked." });
    } else {
      res.render("patient/payment_status", { success: false, message: "Payment was not successful." });
    }
  } catch (error) {
    console.error("Payment Success Error:", error);
    res.status(500).send("Error processing payment success");
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { slot_id, reason } = req.body;
    const patientId = req.user.id;

    // Verify ownership
    const [appt] = await db.execute("SELECT * FROM appointment_slots WHERE id = ? AND patient_id = ?", [slot_id, patientId]);
    if (appt.length === 0) return res.status(403).json({ message: "Unauthorized" });

    await db.execute(
      "UPDATE appointment_slots SET status = 'cancelled', patient_id = NULL, reason = ? WHERE id = ?",
      [reason, slot_id]
    );

    res.json({ success: true, message: "Appointment cancelled" });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const rescheduleAppointment = async (req, res) => {
  try {
    const { old_slot_id, new_slot_id, reason } = req.body;
    const patientId = req.user.id;

    // 1. Cancel old
    await db.execute(
      "UPDATE appointment_slots SET status = 'cancelled', patient_id = NULL, reason = ? WHERE id = ?",
      ["Rescheduled: " + reason, old_slot_id]
    );

    // 2. Book new
    await db.execute(
      "UPDATE appointment_slots SET patient_id = ?, status = 'is_occupied' WHERE id = ?",
      [patientId, new_slot_id]
    );

    res.json({ success: true, message: "Appointment rescheduled successfully" });
  } catch (error) {
    console.error("Reschedule appointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updatePatientProfile = async (req, res) => {
  try {
    const { firstname, lastname, mobile, dob, address, gender, blood_group } = req.body;
    const patientId = req.user.id;

    await db.execute(
      "UPDATE patients SET firstname = ?, lastname = ?, mobile = ?, dob = ?, address = ?, gender = ?, blood_group = ? WHERE id = ?",
      [firstname, lastname, mobile, dob, address, gender, blood_group, patientId]
    );

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const patientProfilePage = async (req, res) => {
  try {
    const patientId = req.user.id;
    const [result] = await db.execute("SELECT * FROM patients WHERE id = ?", [patientId]);
    res.render("patient/patient_profile", { user: result[0] });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

const patientHistoryPage = async (req, res) => {
  try {
    const patientId = req.user.id;
    const [history] = await db.execute(`
      SELECT cr.*, s.firstname as d_first, s.lastname as d_last, dd.department, a.slot_date, a.slot_start
      FROM consultation_records cr 
      JOIN staff s ON cr.doctor_id = s.id 
      JOIN doctor_details dd ON s.id = dd.doctor_id
      JOIN appointment_slots a ON cr.slot_id = a.id 
      WHERE cr.patient_id = ?
      ORDER BY a.slot_date DESC
    `, [patientId]);
    res.render("patient/patient_history", { history, user: req.user });
  } catch (error) {
    console.error("Patient history error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const patientAppoinmentPage = async (req, res) => {
  try {
    const patientId = req.user.id;
    const [appointments] = await db.execute(`
      SELECT a.*, s.firstname as d_first, s.lastname as d_last, dd.department, s.profile_pic,
      CASE 
          WHEN a.status = 'is_occupied' AND (a.slot_date < CURDATE() OR (a.slot_date = CURDATE() AND a.slot_start < CURTIME())) THEN 'missed'
          WHEN a.status = 'is_occupied' THEN 'upcoming'
          WHEN a.status = 'is_fulfilled' THEN 'fulfilled'
          ELSE a.status 
      END as display_status
      FROM appointment_slots a 
      JOIN staff s ON a.doctor_id = s.id 
      JOIN doctor_details dd ON s.id = dd.doctor_id 
      WHERE a.patient_id = ?
      ORDER BY a.slot_date DESC, a.slot_start DESC
    `, [patientId]);
    res.render("patient/patient_appoinments", { appointments, user: req.user });
  } catch (error) {
    console.error("Patient appointments error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const rateDoctor = async (req, res) => {
  const { doctor_id, slot_id, rating, comment } = req.body;
  const patientId = req.user.id;

  try {
    await db.execute(
      "INSERT INTO doctor_ratings (doctor_id, patient_id, slot_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [doctor_id, patientId, slot_id, rating, comment]
    );

    const [[{ avgRating, totalRatings }]] = await db.execute(
      "SELECT AVG(rating) as avgRating, COUNT(*) as totalRatings FROM doctor_ratings WHERE doctor_id = ?",
      [doctor_id]
    );

    await db.execute(
      "UPDATE doctor_details SET rating_avg = ?, total_rating = ? WHERE doctor_id = ?",
      [avgRating, totalRatings, doctor_id]
    );

    res.status(200).json({ message: "Rating submitted successfully" });
  } catch (error) {
    console.error("Rate doctor error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const patientLogout = (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
};

const getPatientDetails = async (req, res) => {
  try {
    const patientId = req.user.id;
    const [result] = await db.execute("SELECT * FROM patients WHERE id = ?", [patientId]);
    if (result.length === 0) return res.status(404).json({ message: "Patient not found" });
    return res.status(200).json({ data: { user: result[0] } });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const patientOtpVerification = async (req, res) => {
  try {
    const { otp } = req.body;
    const signupDetails = req.cookies.signup_details;

    if (!signupDetails) return res.status(400).json({ message: "Session expired. Please sign up again." });

    const { email, otp: hashedOTP } = JSON.parse(signupDetails);
    const isMatch = await bcrypt.compare(otp, hashedOTP);
    if (!isMatch) return res.status(401).json({ message: "Invalid OTP. Please try again." });

    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const patientEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const [result] = await db.execute("SELECT * FROM patients WHERE email = ?", [email.trim().toLowerCase()]);
    if (result.length > 0) return res.status(400).json({ message: "Email already exists" });

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp.toString(), 10);

    const subject = "Your OTP for Patient Registration";
    const html = `<p>Hello,</p><p>Your OTP for registration is: <b>${otp}</b></p><p>This OTP is valid for 10 minutes.</p>`;

    mailSender(email, subject, "", html);

    res.cookie("signup_details", JSON.stringify({ email: email, otp: hashedOTP }), { maxAge: 10 * 60 * 1000 });
    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const insertPatientRegistrationDetails = async (req, res) => {
  try {
    const { firstname, lastname, email, mobile, dob, gender, blood_group, address } = req.body;
    const formattedDob = new Date(dob).toISOString().split("T")[0];

    const query = `INSERT INTO patients (firstname, lastname, email, mobile, dob, gender, blood_group, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    await db.execute(query, [firstname, lastname, email, mobile, formattedDob, gender, blood_group, address]);
    res.clearCookie("signup_details");

    return res.status(200).json({ message: "Patient registered successfully" });
  } catch (error) {
    return res.status(400).json({ message: "Error registering patient" });
  }
};

const loginPatientEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const [result] = await db.execute("SELECT * FROM patients WHERE email = ?", [email.trim().toLowerCase()]);
    if (result.length === 0) return res.status(400).json({ message: "Email does not exist" });

    const otp = generateOTP();

    const hashedOTP = await bcrypt.hash(otp.toString(), 10);

    const subject = "Your OTP for Patient Login";
    const html = `<p>Hello,</p><p>Your OTP for Login is: <b>${otp}</b></p><p>This OTP is valid for 10 minutes.</p>`;

    mailSender(email, subject, "", html);

    res.cookie("login_details", JSON.stringify({ email: email, otp: hashedOTP }), { maxAge: 10 * 60 * 1000 });
    return res.status(200).json({ message: "Login otp Send" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const loginPatientOtpVerification = async (req, res) => {
  try {
    const { otp } = req.body;
    const loginIOTP = req.cookies.login_details;
    if (!loginIOTP) return res.status(440).json({ message: "Session expired. Please login again." });

    const { email, otp: hashedOTP } = JSON.parse(loginIOTP);
    const isMatch = await bcrypt.compare(otp, hashedOTP);
    if (!isMatch) return res.status(400).json({ message: "Invalid OTP. Please try again." });

    const [result] = await db.execute("SELECT id FROM patients WHERE email = ?", [email]);
    if (result.length === 0) return res.status(404).json({ message: "Patient not found" });
    const patientId = result[0].id;

    const token = require("jsonwebtoken").sign({ id: patientId, role: "patient" }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 });
    res.clearCookie("login_details");
    return res.status(200).json({ message: "OTP verified successfully", token });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  patientSignupPageEmail: (req, res) => res.render("patient/patient_signup"),
  patient_login: (req, res) => res.render("patient/patient_login"),
  patientOtpVerifiactionPage: (req, res) => res.render("patient/patient_otp_page"),
  patientSignUpRegistrationPage: (req, res) => res.render("patient/patient_signup_registration"),
  loginPatientOtpVerificationPage: (req, res) => res.render("patient/patient_otp_login_page"),
  patientDashboardPage,
  getDoctorsBySpecialty,
  getAvailableSlots,
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
  updatePatientProfile,
  patientProfilePage,
  patientHistoryPage,
  patientAppoinmentPage,
  rateDoctor,
  patientLogout,
  getPatientDetails,
  patientOtpVerification,
  patientEmailVerification,
  insertPatientRegistrationDetails,
  loginPatientEmailVerification,
  loginPatientOtpVerification,
  createCheckoutSession,
  paymentSuccess,
};

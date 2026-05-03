const db = require("../config/db.config");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const mailSender = require("../utils/mail_sender");
const { cancellationTemplate } = require("../utils/email_templates");
const logger = require("../utils/logger");

const receptionistDashboardPage = async (req, res) => {
  try {
    const [[{ pendingToday }]] = await db.execute("SELECT COUNT(*) as pendingToday FROM appointment_slots WHERE status = 'is_occupied' AND slot_date = CURDATE()");
    const [[{ patientCount }]] = await db.execute("SELECT COUNT(*) as patientCount FROM patients");

    // Fetch Upcoming Appointments (Occupied and Date >= Today)
    const [upcoming] = await db.execute(`
      SELECT a.*, p.firstname as p_first, p.lastname as p_last, p.email as p_email, s.firstname as d_first, s.lastname as d_last, dd.department
      FROM appointment_slots a 
      JOIN patients p ON a.patient_id = p.id 
      JOIN staff s ON a.doctor_id = s.id 
      JOIN doctor_details dd ON s.id = dd.doctor_id
      WHERE a.status = 'is_occupied' AND a.slot_date >= CURDATE()
      ORDER BY a.slot_date, a.slot_start
    `);

    // Fetch In Process Appointments
    const [inProcess] = await db.execute(`
      SELECT a.*, p.firstname as p_first, p.lastname as p_last, p.email as p_email, s.firstname as d_first, s.lastname as d_last, dd.department
      FROM appointment_slots a 
      JOIN patients p ON a.patient_id = p.id 
      JOIN staff s ON a.doctor_id = s.id 
      JOIN doctor_details dd ON s.id = dd.doctor_id
      WHERE a.status = 'is_in_process'
      ORDER BY a.slot_date, a.slot_start
    `);

    // Fetch Completed/Fulfilled Appointments
    const [completed] = await db.execute(`
      SELECT a.*, p.firstname as p_first, p.lastname as p_last, p.email as p_email, s.firstname as d_first, s.lastname as d_last, dd.department
      FROM appointment_slots a 
      JOIN patients p ON a.patient_id = p.id 
      JOIN staff s ON a.doctor_id = s.id 
      JOIN doctor_details dd ON s.id = dd.doctor_id
      WHERE a.status = 'is_fulfilled'
      ORDER BY a.slot_date DESC, a.slot_start DESC
      LIMIT 20
    `);

    // Fetch Absent Appointments (Occupied but Date < Today)
    const [absent] = await db.execute(`
      SELECT a.*, p.firstname as p_first, p.lastname as p_last, p.email as p_email, s.firstname as d_first, s.lastname as d_last, dd.department
      FROM appointment_slots a 
      JOIN patients p ON a.patient_id = p.id 
      JOIN staff s ON a.doctor_id = s.id 
      JOIN doctor_details dd ON s.id = dd.doctor_id
      WHERE a.status = 'is_occupied' AND a.slot_date < CURDATE()
      ORDER BY a.slot_date DESC, a.slot_start DESC
    `);

    res.render("receptionist/receptionist_dashboard", {
      user: req.user,
      counts: { pendingToday, patientCount },
      appointments: { upcoming, inProcess, completed, absent }
    });
  } catch (error) {
    console.error("Receptionist dashboard error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const receptionistAppoinmentPage = async (req, res) => {
  try {
    const [specialties] = await db.execute("SELECT DISTINCT department FROM doctor_details");
    const [appointments] = await db.execute(`
      SELECT a.*, p.firstname as p_first, p.lastname as p_last, s.firstname as d_first, s.lastname as d_last 
      FROM appointment_slots a 
      JOIN patients p ON a.patient_id = p.id 
      JOIN staff s ON a.doctor_id = s.id 
      ORDER BY a.slot_date, a.slot_start
    `);
    res.render("receptionist/receptionist_appointment", {
      user: req.user,
      appointments,
      specialties
    });
  } catch (error) {
    console.error("Receptionist appointments error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const receptionistDoctorPage = async (req, res) => {
  try {
    const [doctors] = await db.execute(`
      SELECT s.*, dd.department, dd.qualification,
      (SELECT COUNT(*) FROM doctor_leaves WHERE doctor_id = s.id AND CURDATE() BETWEEN from_date AND to_date) as on_leave
      FROM staff s 
      JOIN doctor_details dd ON s.id = dd.doctor_id 
      WHERE s.role_id = 2 AND s.is_deleted = 0
    `);

    const [departments] = await db.execute(`
      SELECT DISTINCT department FROM doctor_details
    `);

    res.render("receptionist/receptionist_doctorList", {
      user: req.user,
      doctors,
      departments
    });
  } catch (error) {
    console.error("Receptionist doctor list error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const receptionistPatientsPage = async (req, res) => {
  try {
    const [patients] = await db.execute("SELECT * FROM patients ORDER BY created_at DESC");
    const [[{ totalPatients }]] = await db.execute("SELECT COUNT(*) as totalPatients FROM patients");

    res.render("receptionist/receptionist_patientList", {
      user: req.user,
      patients,
      totalPatients
    });
  } catch (error) {
    console.error("Receptionist patient list error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const updatePatient = async (req, res) => {
  const { id, firstname, lastname, mobile, email, gender, address, dob, blood_group } = req.body;
  try {
    await db.execute(
      "UPDATE patients SET firstname = ?, lastname = ?, mobile = ?, email = ?, gender = ?, address = ?, dob = ?, blood_group = ? WHERE id = ?",
      [firstname, lastname, mobile, email, gender, address, dob, blood_group, id]
    );
    res.status(200).json({ success: true, message: "Patient updated successfully" });
  } catch (error) {
    console.error("Update patient error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const bookAppointment = async (req, res) => {
  const { slot_id, patient_id } = req.body;
  try {
    await db.execute(
      "UPDATE appointment_slots SET patient_id = ?, status = 'is_occupied' WHERE id = ? AND status = 'is_available'",
      [patient_id, slot_id]
    );
    res.status(200).json({ message: "Appointment booked successfully" });
  } catch (error) {
    console.error("Book appointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateVitals = async (req, res) => {
  const { patient_id, appointment_id, bp, weight, temperature, pulse, spo2 } = req.body;
  const slot_id = appointment_id; // Mapping frontend name to backend name

  try {
    const vitalsData = [
      { type: 'BP', value: bp },
      { type: 'Weight', value: weight },
      { type: 'Temp', value: temperature },
      { type: 'HR', value: pulse },
      { type: 'SpO2', value: spo2 }
    ];

    for (const vital of vitalsData) {
      if (vital.value) { // Only save if value is provided
        await db.execute(
          "INSERT INTO patient_vitals (slot_id, patient_id, entity_type, entity_value) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE entity_value = ?",
          [slot_id, patient_id, vital.type, vital.value, vital.value]
        );
      }
    }
    res.status(200).json({ success: true, message: "Vitals updated successfully" });
  } catch (error) {
    console.error("Update vitals error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const receptionistProfilePage = (req, res) => {
  res.render("receptionist/receptionist_profile", { user: req.user });
};

const uploadReport = async (req, res) => {
  const { patient_id } = req.body;
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  
  const report_url = req.file.path; // Cloudinary URL
  const report_name = req.file.originalname; // Original filename

  try {
    await db.execute(
      "INSERT INTO patient_reports (patient_id, report_name, report_url, upload_date) VALUES (?, ?, ?, CURDATE())",
      [patient_id, report_name, report_url]
    );
    res.status(200).json({ success: true, message: "Report uploaded successfully", url: report_url });
  } catch (error) {
    console.error("Upload report error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const registerPatient = async (req, res) => {
  const { firstname, lastname, mobile, email, gender, address, dob, blood_group } = req.body;
  try {
    const [result] = await db.execute(
      "INSERT INTO patients (firstname, lastname, mobile, email, gender, address, dob, blood_group) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [firstname, lastname, mobile, email, gender, address, dob, blood_group]
    );
    res.status(201).json({ success: true, message: "Patient registered successfully", patientId: result.insertId });
  } catch (error) {
    console.error("Register patient error:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

const cancelAppointment = async (req, res) => {
  const { slot_id, reason } = req.body;
  try {
    const [[appt]] = await db.execute(
      `SELECT a.payment_intent_id, p.email, p.firstname, p.lastname,
              s.firstname AS doc_first, s.lastname AS doc_last,
              a.slot_date, a.slot_start
       FROM appointment_slots a
       JOIN patients p ON a.patient_id = p.id
       JOIN staff s ON a.doctor_id = s.id
       WHERE a.id = ? AND a.patient_id IS NOT NULL`,
      [slot_id]
    );

    if (!appt) {
      return res.status(404).json({ message: "Appointment not found or already cancelled" });
    }

    await db.execute(
      "UPDATE appointment_slots SET patient_id = NULL, status = 'is_available', reason = ? WHERE id = ?",
      [reason || null, slot_id]
    );

    if (appt.payment_intent_id) {
      try {
        await stripe.refunds.create({ payment_intent: appt.payment_intent_id });
        logger.info("CANCEL", "Stripe refund issued", { slot_id, payment_intent: appt.payment_intent_id });
      } catch (refundErr) {
        logger.error("CANCEL", "Stripe refund failed", { slot_id, error: refundErr.message });
      }
    }

    const html = cancellationTemplate({
      patientName: `${appt.firstname} ${appt.lastname}`,
      doctorName: `${appt.doc_first} ${appt.doc_last}`,
      slotDate: appt.slot_date,
      slotStart: appt.slot_start,
      reason: reason || 'No reason provided',
    });
    mailSender(appt.email, "Your Appointment Has Been Cancelled – Kalp Hospital", "", html);

    res.status(200).json({ message: "Appointment cancelled successfully" });
  } catch (error) {
    logger.error("CANCEL", "Cancel appointment error", { error: error.message, slot_id });
    res.status(500).json({ message: "Internal server error" });
  }
};

const rescheduleAppointment = async (req, res) => {
  const { old_slot_id, new_slot_id, patient_id } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Free the old slot
    await connection.execute(
      "UPDATE appointment_slots SET patient_id = NULL, status = 'is_available' WHERE id = ?",
      [old_slot_id]
    );

    // 2. Book the new slot
    await connection.execute(
      "UPDATE appointment_slots SET patient_id = ?, status = 'is_occupied' WHERE id = ? AND status = 'is_available'",
      [patient_id, new_slot_id]
    );

    await connection.commit();
    res.status(200).json({ message: "Appointment rescheduled successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Reschedule appointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};

const verifyPatientByEmail = async (req, res) => {
  const email = req.body.email ? req.body.email.trim() : '';
  try {
    const [patients] = await db.execute("SELECT id, firstname, lastname FROM patients WHERE email = ?", [email]);
    if (patients.length > 0) {
      res.status(200).json({ success: true, patient: patients[0] });
    } else {
      res.status(404).json({ success: false, message: "Patient not found" });
    }
  } catch (error) {
    console.error("Verify patient error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getSlotsForReschedule = async (req, res) => {
  const { doctor_id, date } = req.query;
  try {
    const [slots] = await db.execute(
      "SELECT id, slot_start FROM appointment_slots WHERE doctor_id = ? AND slot_date = ? AND status = 'is_available'",
      [doctor_id, date]
    );
    res.status(200).json({ slots });
  } catch (error) {
    console.error("Get slots error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addReportPage = (req, res) => {
  res.render("receptionist/receptionist_addReport", { user: req.user });
};

const startConsultation = async (req, res) => {
  const { slot_id } = req.body;
  try {
    // 1. Get the appointment to find the doctor_id
    const [[appointment]] = await db.execute(
      "SELECT doctor_id FROM appointment_slots WHERE id = ?",
      [slot_id]
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    const doctor_id = appointment.doctor_id;

    // 2. Check if THIS doctor already has an active session
    const [activeSessions] = await db.execute(
      "SELECT id FROM appointment_slots WHERE doctor_id = ? AND status = 'is_in_process'",
      [doctor_id]
    );

    if (activeSessions.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "This doctor already has a consultation in progress. Please wait until it's completed." 
      });
    }

    await db.execute(
      "UPDATE appointment_slots SET status = 'is_in_process' WHERE id = ?",
      [slot_id]
    );
    res.status(200).json({ success: true, message: "Patient sent to doctor" });
  } catch (error) {
    console.error("Start consultation error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  receptionistDashboardPage,
  receptionistAppoinmentPage,
  receptionistDoctorPage,
  receptionistPatientsPage,
  receptionistProfilePage,
  addReportPage,
  bookAppointment,
  updateVitals,
  uploadReport,
  verifyPatientByEmail,
  getSlotsForReschedule,
  registerPatient,
  startConsultation,
  updatePatient
};

const getDoctorsByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const [doctors] = await db.execute(`
      SELECT s.id, s.firstname, s.lastname, s.profile_pic, dd.department, dd.qualification, dd.experience, dd.rating_avg
      FROM staff s
      JOIN doctor_details dd ON s.id = dd.doctor_id
      WHERE dd.department = ? AND s.role_id = 2 AND s.is_deleted = 0
    `, [department]);

    res.render("receptionist/department_doctor", {
      departmentName: department,
      doctors,
      user: req.user
    });
  } catch (error) {
    console.error("Get doctors by department error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const receptionistLeavesPage = async (req, res) => {
  const receptionist_id = req.user.id;
  try {
    const [leaves] = await db.execute(
      "SELECT * FROM receptionist_leaves WHERE receptionist_id = ? ORDER BY created_at DESC",
      [receptionist_id]
    );

    const [[{ totalLeaves }]] = await db.execute(
      "SELECT COUNT(*) as totalLeaves FROM receptionist_leaves WHERE receptionist_id = ? AND status = 'approved'",
      [receptionist_id]
    );

    res.render("receptionist/receptionist_leaves", {
      leaves,
      totalLeaves,
      user: req.user
    });
  } catch (error) {
    console.error("Receptionist leaves page error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const applyLeave = async (req, res) => {
  const { from_date, to_date, reason } = req.body;
  const receptionist_id = req.user.id;

  try {
    // Check for overlapping leaves (pending or approved)
    const [overlapping] = await db.execute(
      "SELECT id FROM receptionist_leaves WHERE receptionist_id = ? AND status IN ('pending', 'approved') AND (from_date <= ? AND to_date >= ?)",
      [receptionist_id, to_date, from_date]
    );

    if (overlapping.length > 0) {
      return res.status(400).json({ success: false, message: "A leave request already exists or overlaps with this date range." });
    }

    await db.execute(
      "INSERT INTO receptionist_leaves (receptionist_id, from_date, to_date, reason, status) VALUES (?, ?, ?, ?, 'pending')",
      [receptionist_id, from_date, to_date, reason]
    );
    res.status(200).json({ success: true, message: "Leave applied successfully" });
  } catch (error) {
    console.error("Apply leave error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  receptionistDashboardPage,
  receptionistAppoinmentPage,
  receptionistDoctorPage,
  receptionistPatientsPage,
  receptionistProfilePage,
  addReportPage,
  bookAppointment,
  updateVitals,
  uploadReport,
  cancelAppointment,
  rescheduleAppointment,
  verifyPatientByEmail,
  getSlotsForReschedule,
  registerPatient,
  getDoctorsByDepartment,
  startConsultation,
  updatePatient,
  receptionistLeavesPage,
  applyLeave
};

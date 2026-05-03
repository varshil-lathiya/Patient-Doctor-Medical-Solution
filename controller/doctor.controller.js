const db = require("../config/db.config");

const doctorDashboard = async (req, res) => {
  try {
    const doctor_id = req.user.id;

    // 1. Get Today's Pending Appointments (In Process)
    const [pendingToday] = await db.execute(`
      SELECT a.*, p.firstname, p.lastname, p.gender, p.dob 
      FROM appointment_slots a 
      JOIN patients p ON a.patient_id = p.id 
      WHERE a.doctor_id = ? AND a.status = 'is_in_process'
      ORDER BY a.slot_start
    `, [doctor_id]);

    // 2. Get Today's Upcoming Appointments (Occupied but not yet in process)
    const [upcomingToday] = await db.execute(`
      SELECT a.*, p.firstname, p.lastname, p.gender, p.dob 
      FROM appointment_slots a 
      JOIN patients p ON a.patient_id = p.id 
      WHERE a.doctor_id = ? AND a.status = 'is_occupied' AND DATE(a.slot_date) = CURDATE()
      ORDER BY a.slot_start
    `, [doctor_id]);

    // 3. Get Statistics for Today
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('is_occupied', 'is_in_process') THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'is_fulfilled' THEN 1 ELSE 0 END) as fulfilled
      FROM appointment_slots 
      WHERE doctor_id = ? AND DATE(slot_date) = CURDATE()
    `, [doctor_id]);

    res.render("doctor/doctor_dashboard", {
      user: req.user,
      pendingToday,
      upcomingToday,
      stats: stats[0] || { total: 0, pending: 0, fulfilled: 0 }
    });
  } catch (error) {
    console.error("Doctor dashboard error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const doctorAppoinmentPage = async (req, res) => {
  try {
    const doctor_id = req.user.id;

    // 1. Upcoming Appointments (Today and Future)
    const [upcoming] = await db.execute(`
      SELECT a.*, p.firstname, p.lastname, p.gender, p.dob 
      FROM appointment_slots a 
      JOIN patients p ON a.patient_id = p.id 
      WHERE a.doctor_id = ? AND (a.status = 'is_in_process' OR (a.status = 'is_occupied' AND DATE(a.slot_date) >= CURDATE()))
      ORDER BY a.slot_date, a.slot_start
    `, [doctor_id]);

    // 2. Past Appointments (No-show: past date and still occupied/in-process)
    const [past] = await db.execute(`
      SELECT a.*, p.firstname, p.lastname, p.gender, p.dob 
      FROM appointment_slots a 
      JOIN patients p ON a.patient_id = p.id 
      WHERE a.doctor_id = ? AND a.status IN ('is_occupied', 'is_in_process') AND DATE(a.slot_date) < CURDATE()
      ORDER BY a.slot_date DESC, a.slot_start DESC
    `, [doctor_id]);

    // 3. Completed Appointments (Fulfilled) - Limit to 50 for performance
    const [completed] = await db.execute(`
      SELECT a.*, p.firstname, p.lastname, p.gender, p.dob 
      FROM appointment_slots a 
      JOIN patients p ON a.patient_id = p.id 
      WHERE a.doctor_id = ? AND a.status = 'is_fulfilled'
      ORDER BY a.slot_date DESC, a.slot_start DESC
      LIMIT 50
    `, [doctor_id]);

    res.render("doctor/doctor_all_appoinments", { 
      user: req.user, 
      upcoming,
      past,
      completed
    });
  } catch (error) {
    console.error("Doctor appointments error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const setAvailability = async (req, res) => {
  const { slot_date, start_time, end_time, duration } = req.body;
  const doctor_id = req.user.id;

  try {
    // 1. Save or Update Availability
    await db.execute(
      "INSERT INTO doctor_availability (doctor_id, start_time, end_time, duration) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE start_time=?, end_time=?, duration=?",
      [doctor_id, start_time, end_time, duration, start_time, end_time, duration]
    );

    await db.beginTransaction();
    try {
      // 2. Clear existing available slots for this date to avoid duplicates
      await db.execute(
        "DELETE FROM appointment_slots WHERE doctor_id = ? AND slot_date = ? AND status = 'is_available'",
        [doctor_id, slot_date]
      );

      // 3. Generate Slots
      let current = new Date(`${slot_date}T${start_time}`);
      const end = new Date(`${slot_date}T${end_time}`);

      while (current < end) {
        const slot_start = current.toTimeString().split(' ')[0];
        current.setMinutes(current.getMinutes() + parseInt(duration));
        const slot_end = current.toTimeString().split(' ')[0];

        if (current > end) break;

        await db.execute(
          "INSERT INTO appointment_slots (doctor_id, slot_date, slot_start, slot_end, status) VALUES (?, ?, ?, ?, 'is_available')",
          [doctor_id, slot_date, slot_start, slot_end]
        );
      }

      await db.commit();
    } catch (txError) {
      await db.rollback();
      throw txError;
    }

    res.status(200).json({ message: "Slots generated successfully" });
  } catch (error) {
    console.error("Set availability error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const recordConsultation = async (req, res) => {
  const {
    slot_id,
    patient_id,
    symptoms,
    observation,
    diagnosis,
    conclusion,
    medicines
  } = req.body;
  const doctor_id = req.user.id;

  try {
    // Construct summary text from individual fields
    const summary_text = `Symptoms: ${symptoms}\nObservation: ${observation}\nDiagnosis: ${diagnosis}\nConclusion: ${conclusion}`;

    // Process medicines
    const medicineList = Array.isArray(medicines) ? medicines : [];
    const medicineNames = medicineList.map(m => m.name).join(", ");
    const dosages = medicineList.map(m => m.dosage).join(", ");
    const durations = medicineList.map(m => m.days).join(", ");
    const instructions = medicineList.map(m => m.instruction).join(", ");

    // 1. Insert Consultation Record
    await db.execute(
      "INSERT INTO consultation_records (slot_id, doctor_id, patient_id, summary_text, symptoms, observation, diagnosis, conclusion, medicine, dosage, days, instruction) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [slot_id, doctor_id, patient_id, summary_text, symptoms, observation, diagnosis, conclusion, medicineNames, dosages, durations, instructions]
    );

    // 2. Update Slot Status
    await db.execute(
      "UPDATE appointment_slots SET status = 'is_fulfilled' WHERE id = ? AND doctor_id = ?",
      [slot_id, doctor_id]
    );

    res.status(200).json({ message: "Consultation recorded successfully" });
  } catch (error) {
    console.error("Record consultation error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const doctorProfile = async (req, res) => {
  try {
    const doctor_id = req.user.id;
    const [[doctor]] = await db.execute(`
      SELECT s.*, dd.department, dd.qualification, dd.experience, dd.degree, dd.consultation_fee, dd.rating 
      FROM staff s 
      LEFT JOIN doctor_details dd ON s.id = dd.doctor_id 
      WHERE s.id = ?
    `, [doctor_id]);

    const [slots] = await db.execute("SELECT * FROM doctor_availability WHERE doctor_id = ?", [doctor_id]);

    res.render("doctor/doctor_profile", { user: doctor, slots });
  } catch (error) {
    console.error("Doctor profile error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const patient_history = async (req, res) => {
  const { patient_id, slot_id } = req.params;
  try {
    const [[access]] = await db.execute(
      "SELECT id FROM appointment_slots WHERE doctor_id = ? AND patient_id = ? LIMIT 1",
      [req.user.id, patient_id]
    );
    if (!access) return res.status(403).send("Forbidden");

    // 1. Get Patient Details
    const [[patient]] = await db.execute("SELECT * FROM patients WHERE id = ?", [patient_id]);

    // 2. Get All Vitals
    const [vitalsList] = await db.execute(
      "SELECT * FROM patient_vitals WHERE patient_id = ? ORDER BY id DESC",
      [patient_id]
    );

    // Group vitals by slot_id for easier display (optional, but good for history)
    // For the current session, we just need the latest ones.
    const vitals = {};
    vitalsList.forEach(v => {
      if (!vitals[v.slot_id]) vitals[v.slot_id] = {};
      vitals[v.slot_id][v.entity_type] = v.entity_value;
    });

    // Get the vitals for the most recent slot that has vitals
    const latestVitals = vitalsList.length > 0 ? vitals[vitalsList[0].slot_id] : {};

    // 3. Get Consultation History
    const [history] = await db.execute(`
      SELECT cr.*, s.firstname AS doc_first, s.lastname AS doc_last, a.slot_date, a.slot_start
      FROM consultation_records cr 
      JOIN staff s ON cr.doctor_id = s.id 
      LEFT JOIN appointment_slots a ON cr.slot_id = a.id
      WHERE cr.patient_id = ? 
      ORDER BY cr.id DESC
    `, [patient_id]);

    // 4. Get Patient Reports
    const [reports] = await db.execute("SELECT * FROM patient_reports WHERE patient_id = ?", [patient_id]);

    res.render("doctor/patient_history", {
      user: req.user,
      patient,
      vitals: latestVitals,
      history,
      reports,
      slot_id
    });
  } catch (error) {
    console.error("Patient history error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const doctorLeavesPage = async (req, res) => {
  const doctor_id = req.user.id;
  try {
    const [leaves] = await db.execute(
      "SELECT * FROM doctor_leaves WHERE doctor_id = ? ORDER BY created_at DESC",
      [doctor_id]
    );

    const [[{ totalLeaves }]] = await db.execute(
      "SELECT COUNT(*) as totalLeaves FROM doctor_leaves WHERE doctor_id = ? AND status = 'approved'",
      [doctor_id]
    );

    res.render("doctor/doctor_leaves", {
      leaves,
      totalLeaves,
      user: req.user,
      currentPage: 'leaves'
    });
  } catch (error) {
    console.error("Doctor leaves page error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const applyLeave = async (req, res) => {
  const { from_date, to_date, reason } = req.body;
  const doctor_id = req.user.id;

  try {
    // Check for overlapping leaves (pending or approved)
    const [overlapping] = await db.execute(
      "SELECT id FROM doctor_leaves WHERE doctor_id = ? AND status IN ('pending', 'approved') AND (from_date <= ? AND to_date >= ?)",
      [doctor_id, to_date, from_date]
    );

    if (overlapping.length > 0) {
      return res.status(400).json({ success: false, message: "A leave request already exists or overlaps with this date range." });
    }

    await db.execute(
      "INSERT INTO doctor_leaves (doctor_id, from_date, to_date, reason, status) VALUES (?, ?, ?, ?, 'pending')",
      [doctor_id, from_date, to_date, reason]
    );
    res.status(200).json({ success: true, message: "Leave applied successfully" });
  } catch (error) {
    console.error("Apply leave error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateDoctorProfile = async (req, res) => {
  const doctor_id = req.user.id;
  const {
    firstname,
    lastname,
    email,
    mobile,
    dob,
    gender,
    address,
    department,
    qualification,
    degree,
    consultation_fee,
    experience,
    morning_start,
    morning_end,
    evening_start,
    evening_end,
    duration
  } = req.body;

  try {
    // 1. Update staff table
    await db.execute(
      `UPDATE staff SET 
        firstname = ?, 
        lastname = ?, 
        email = ?, 
        mobile = ?, 
        dob = ?, 
        gender = ?, 
        address = ?
      WHERE id = ?`,
      [firstname, lastname, email, mobile, dob || null, gender, address, doctor_id]
    );

    // 2. Update doctor_details table
    await db.execute(
      `INSERT INTO doctor_details (doctor_id, department, qualification, degree, consultation_fee, experience) 
       VALUES (?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
        department = VALUES(department),
        qualification = VALUES(qualification), 
        degree = VALUES(degree), 
        consultation_fee = VALUES(consultation_fee), 
        experience = VALUES(experience)`,
      [doctor_id, department, qualification, degree, consultation_fee ?? null, experience]
    );

    // 3. Update doctor_availability table
    await db.execute(
      `INSERT INTO doctor_availability (doctor_id, morning_start, morning_end, evening_start, evening_end, duration) 
       VALUES (?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
        morning_start = VALUES(morning_start), 
        morning_end = VALUES(morning_end), 
        evening_start = VALUES(evening_start), 
        evening_end = VALUES(evening_end), 
        duration = VALUES(duration)`,
      [doctor_id, morning_start || '10:00:00', morning_end || '13:00:00', evening_start || '15:00:00', evening_end || '18:00:00', duration || 30]
    );

    // Trigger Slot Generation
    const { syncAllDoctorSlots } = require("../utils/cron");
    syncAllDoctorSlots();

    res.status(200).json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update doctor profile error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const finish_session = async (req, res) => {
  const { slot_id } = req.body;
  try {
    await db.execute("UPDATE appointment_slots SET status = 'is_fulfilled' WHERE id = ?", [slot_id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Finish session error:", error);
    res.status(500).json({ success: false });
  }
};

module.exports = {
  doctorDashboard,
  doctorAppoinmentPage,
  doctorProfile,
  patient_history,
  setAvailability,
  recordConsultation,
  finish_session,
  applyLeave,
  doctorLeavesPage,
  updateDoctorProfile
};

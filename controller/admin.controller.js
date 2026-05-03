const db = require("../config/db.config");
const bcrypt = require("bcrypt");
const mailSender = require("../utils/mail_sender");

const dashboard = async (req, res) => {
  try {
    const [[{ doctorCount }]] = await db.execute("SELECT COUNT(*) as doctorCount FROM staff WHERE role_id = 2 AND is_deleted = 0");
    const [[{ receptionistCount }]] = await db.execute("SELECT COUNT(*) as receptionistCount FROM staff WHERE role_id = 3 AND is_deleted = 0");
    const [[{ patientCount }]] = await db.execute("SELECT COUNT(*) as patientCount FROM patients");
    
    // Total appointments booked/occupied till CURRENT DATE
    const [[{ appointmentCount }]] = await db.execute("SELECT COUNT(*) as appointmentCount FROM appointment_slots WHERE (status = 'is_occupied' OR status = 'is_fulfilled') AND slot_date <= CURDATE()");

    const [[{ pendingLeaves }]] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM doctor_leaves WHERE status = 'pending') + 
        (SELECT COUNT(*) FROM receptionist_leaves WHERE status = 'pending') 
      as pendingLeaves
    `);

    // Fetch staff on leave TODAY
    const [staffOnLeaveToday] = await db.execute(`
      (SELECT s.firstname, s.lastname, dd.department, 'Doctor' as role_name 
       FROM doctor_leaves dl 
       JOIN staff s ON dl.doctor_id = s.id 
       JOIN doctor_details dd ON s.id = dd.doctor_id
       WHERE dl.status = 'approved' AND CURDATE() BETWEEN dl.from_date AND dl.to_date)
      UNION ALL
      (SELECT s.firstname, s.lastname, 'Front Desk' as department, 'Receptionist' as role_name 
       FROM receptionist_leaves rl 
       JOIN staff s ON rl.receptionist_id = s.id 
       WHERE rl.status = 'approved' AND CURDATE() BETWEEN rl.from_date AND rl.to_date)
    `);

    res.render("admin/admin_dashboard", {
      counts: { 
        doctorCount, 
        receptionistCount, 
        patientCount, 
        appointmentCount, 
        pendingLeaves,
        onLeaveTodayCount: staffOnLeaveToday.length
      },
      staffOnLeaveToday,
      user: req.user
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const doctors_list = async (req, res) => {
  try {
    const [doctors] = await db.execute(`
      SELECT s.*, d.department, d.degree, d.qualification, d.experience, d.rating_avg, d.total_rating 
      FROM staff s 
      JOIN doctor_details d ON s.id = d.doctor_id 
      WHERE s.role_id = 2 AND s.is_deleted = 0
    `);

    const defaultDepts = [
      'Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Pediatrics', 
      'Pulmonology', 'Gastroenterology', 'Ophthalmology', 'Nephrology',
      'Dermatology', 'Psychiatry', 'General Medicine', 'ENT'
    ];
    const [dbDepartments] = await db.execute("SELECT DISTINCT department FROM doctor_details WHERE department IS NOT NULL AND department != '' ORDER BY department");
    const departments = [...new Set([...defaultDepts, ...dbDepartments.map(d => d.department)])].sort();

    res.render("admin/admin_doctors", {
      doctors,
      departments,
      user: req.user
    });
  } catch (error) {
    console.error("Doctors list error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const receptionist_list = async (req, res) => {
  try {
    const [[{ staffCount }]] = await db.execute("SELECT COUNT(*) as staffCount FROM staff WHERE is_deleted = 0");
    const [[{ patientCount }]] = await db.execute("SELECT COUNT(*) as patientCount FROM patients");

    const [receptionists] = await db.execute("SELECT * FROM staff WHERE role_id = 3 AND is_deleted = 0");
    res.render("admin/receptionist_list", {
      receptionists,
      counts: { staffCount, patientCount },
      user: req.user
    });
  } catch (error) {
    console.error("Receptionist list error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const addStaff = async (req, res) => {
  const { 
    firstname, lastname, email, password, role_id, mobile, address, gender, dob, blood_group, 
    department, degree, qualification, experience,
    morning_start, morning_end, evening_start, evening_end, duration
  } = req.body;

  try {
    // Check if email exists
    const [existing] = await db.execute("SELECT id FROM staff WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password || "Pdms@123", 10); // Default password if not provided

    const [result] = await db.execute(
      "INSERT INTO staff (firstname, lastname, email, password, role_id, mobile, address, gender, dob, blood_group) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [firstname || null, lastname || null, email || null, hashedPassword, role_id || null, mobile || null, address || null, gender || null, dob || null, blood_group || null]
    );

    if (role_id == 2) { // Doctor
      await db.execute(
        "INSERT INTO doctor_details (doctor_id, department, degree, qualification, experience) VALUES (?, ?, ?, ?, ?)",
        [result.insertId, department || null, degree || null, qualification || null, experience || null]
      );

      // Insert into doctor_availability
      await db.execute(
        "INSERT INTO doctor_availability (doctor_id, morning_start, morning_end, evening_start, evening_end, duration) VALUES (?, ?, ?, ?, ?, ?)",
        [
          result.insertId, 
          morning_start || '10:00:00', 
          morning_end || '13:00:00', 
          evening_start || '15:00:00', 
          evening_end || '18:00:00', 
          duration || 30
        ]
      );

      // Trigger Slot Generation
      const { syncAllDoctorSlots } = require("../utils/cron");
      // Use a timeout or handle asynchronously to not block the response
      syncAllDoctorSlots(); 
    }

    res.status(201).json({ success: true, message: "Staff added successfully" });
  } catch (error) {
    console.error("Add staff error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateStaff = async (req, res) => {
  const { id } = req.params;
  const { 
    firstname, lastname, email, password, mobile, address, gender, dob, blood_group, 
    department, degree, qualification, experience,
    morning_start, morning_end, evening_start, evening_end, duration
  } = req.body;

  try {
    let updateQuery = "UPDATE staff SET firstname = ?, lastname = ?, mobile = ?, address = ?, gender = ?, dob = ?, blood_group = ?";
    let queryParams = [firstname || null, lastname || null, mobile || null, address || null, gender || null, dob || null, blood_group || null];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ", password = ?";
      queryParams.push(hashedPassword);
    }

    updateQuery += " WHERE id = ?";
    queryParams.push(id);

    await db.execute(updateQuery, queryParams);

    const [staff] = await db.execute("SELECT role_id FROM staff WHERE id = ?", [id]);
    if (staff.length > 0 && staff[0].role_id == 2) {
      await db.execute(
        "UPDATE doctor_details SET department = ?, degree = ?, qualification = ?, experience = ? WHERE doctor_id = ?",
        [department || null, degree || null, qualification || null, experience || null, id]
      );

      // Update doctor_availability
      await db.execute(
        "UPDATE doctor_availability SET morning_start = ?, morning_end = ?, evening_start = ?, evening_end = ?, duration = ? WHERE doctor_id = ?",
        [morning_start || '10:00:00', morning_end || '13:00:00', evening_start || '15:00:00', evening_end || '18:00:00', duration || 30, id]
      );

      // Trigger Slot Generation to reflect changes
      const { syncAllDoctorSlots } = require("../utils/cron");
      syncAllDoctorSlots();
    }

    res.json({ success: true, message: "Staff updated successfully" });
  } catch (error) {
    console.error("Update staff error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getStaffById = async (req, res) => {
  const { id } = req.params;
  try {
    const [staff] = await db.execute(`
      SELECT s.id, s.firstname, s.lastname, s.email, s.mobile, s.address, s.gender, s.dob, s.blood_group, s.role_id,
             d.department, d.degree, d.qualification, d.experience,
             da.morning_start, da.morning_end, da.evening_start, da.evening_end, da.duration
      FROM staff s
      LEFT JOIN doctor_details d ON s.id = d.doctor_id
      LEFT JOIN doctor_availability da ON s.id = da.doctor_id
      WHERE s.id = ?
    `, [id]);

    if (staff.length === 0) return res.status(404).json({ message: "Staff not found" });
    res.json({ success: true, data: staff[0] });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteStaff = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute("UPDATE staff SET is_deleted = 1 WHERE id = ?", [id]);
    res.status(200).json({ message: "Staff deleted successfully" });
  } catch (error) {
    console.error("Delete staff error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const manageLeaves = async (req, res) => {
  try {
    const [leaves] = await db.execute(`
      (SELECT dl.id, dl.from_date, dl.to_date, dl.reason, dl.status, dl.admin_remark, dl.created_at, s.firstname, s.lastname, dd.department, 'Doctor' as role_name 
       FROM doctor_leaves dl 
       JOIN staff s ON dl.doctor_id = s.id 
       JOIN doctor_details dd ON s.id = dd.doctor_id)
      UNION ALL
      (SELECT rl.id, rl.from_date, rl.to_date, rl.reason, rl.status, rl.admin_remark, rl.created_at, s.firstname, s.lastname, 'N/A' as department, 'Receptionist' as role_name 
       FROM receptionist_leaves rl 
       JOIN staff s ON rl.receptionist_id = s.id)
      ORDER BY created_at DESC
    `);

    const counts = {
      pending: leaves.filter(l => l.status === 'pending').length,
      approved: leaves.filter(l => l.status === 'approved').length,
      rejected: leaves.filter(l => l.status === 'rejected').length
    };

    res.render("admin/manage_leaves", { leaves, counts, user: req.user });
  } catch (error) {
    console.error("Manage leaves error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const updateLeaveStatus = async (req, res) => {
  const { id, status, admin_remark, role } = req.body;
  const table = role === 'Doctor' ? 'doctor_leaves' : 'receptionist_leaves';
  const idField = role === 'Doctor' ? 'doctor_id' : 'receptionist_id';

  try {
    // Fetch staff details for email notification
    const [staffDetails] = await db.execute(`
      SELECT s.email, s.firstname, t.from_date, t.to_date, t.${idField} as staff_id
      FROM ${table} t 
      JOIN staff s ON t.${idField} = s.id 
      WHERE t.id = ?
    `, [id]);

    await db.execute(
      `UPDATE ${table} SET status = ?, admin_remark = ? WHERE id = ?`,
      [status, admin_remark, id]
    );

    if (staffDetails.length > 0) {
      const { email, firstname, from_date, to_date, staff_id } = staffDetails[0];
      const subject = `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`;
      const message = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: ${status === 'approved' ? '#059669' : '#dc2626'}; text-transform: capitalize;">Leave Request ${status}</h2>
          <p>Hello <strong>${firstname}</strong>,</p>
          <p>Your leave request from <strong>${new Date(from_date).toLocaleDateString()}</strong> to <strong>${new Date(to_date).toLocaleDateString()}</strong> has been <strong>${status}</strong> by the administrator.</p>
          ${admin_remark ? `<p><strong>Admin Remark:</strong> ${admin_remark}</p>` : ''}
          <p>You can check the details on your dashboard.</p>
          <br>
          <p>Best Regards,<br>PDMS Administration</p>
        </div>
      `;
      mailSender(email, subject, "", message);

      if (status === 'approved' && role === 'Doctor') {
        const fromDateStr = new Date(from_date.getTime() - (from_date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        const toDateStr = new Date(to_date.getTime() - (to_date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        // Fetch affected appointments
        const [affectedSlots] = await db.execute(`
          SELECT a.id, a.slot_date, a.slot_start, p.email, p.firstname 
          FROM appointment_slots a 
          JOIN patients p ON a.patient_id = p.id 
          WHERE a.doctor_id = ? AND a.slot_date BETWEEN ? AND ? AND a.status = 'is_occupied'
        `, [staff_id, fromDateStr, toDateStr]);

        for (const slot of affectedSlots) {
          // Send email to patient
          const patientSubject = "Emergency Notice: Doctor on Leave - Action Required";
          const patientMessage = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #dc2626;">Doctor Emergency Leave</h2>
              <p>Hello <strong>${slot.firstname}</strong>,</p>
              <p>We sincerely apologize, but your doctor has taken an emergency leave for the date of your upcoming appointment on <strong>${new Date(slot.slot_date).toLocaleDateString()}</strong> at <strong>${slot.slot_start}</strong>.</p>
              <p>Your appointment is currently still active in our system, but the doctor will not be available. Please log in to the PDMS portal as soon as possible to kindly reschedule or cancel your appointment.</p>
              <br>
              <p>Best Regards,<br>PDMS Administration</p>
            </div>
          `;
          mailSender(slot.email, patientSubject, "", patientMessage);

          // Update slot to flag for reschedule (keep is_occupied)
          await db.execute(
            "UPDATE appointment_slots SET reason = 'Doctor on Emergency Leave' WHERE id = ?",
            [slot.id]
          );
        }
      }
    }

    res.json({ success: true, message: `Leave ${status} successfully and notification sent` });
  } catch (error) {
    console.error("Update leave status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  dashboard,
  doctors_list,
  receptionist_list,
  addStaff,
  updateStaff,
  getStaffById,
  deleteStaff,
  manageLeaves,
  updateLeaveStatus
};

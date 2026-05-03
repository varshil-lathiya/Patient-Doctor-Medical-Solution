const mysql = require("mysql2/promise");

async function testQuery() {
    const connection = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "patient_doctor_management_system",
    });

    try {
        const patientId = 1; // Test ID
        const [history] = await connection.execute(`
      SELECT cr.*, s.firstname as d_first, s.lastname as d_last, dd.department, a.slot_date, a.slot_start
      FROM consultation_records cr 
      JOIN staff s ON cr.doctor_id = s.id 
      JOIN doctor_details dd ON s.id = dd.doctor_id
      JOIN appointment_slots a ON cr.slot_id = a.id 
      WHERE cr.patient_id = ?
      ORDER BY a.slot_date DESC
    `, [patientId]);
        console.log("SUCCESS: Query executed, records found:", history.length);
    } catch (error) {
        console.error("QUERY ERROR:", error.message);
        if (error.stack) console.error(error.stack);
    } finally {
        await connection.end();
    }
}

testQuery();

const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "patient_doctor_management_system",
});

connection.connect(err => {
  if (err) console.error("DB connection failed:", err);
  else console.log("✅ Connected to DB");
});

module.exports = connection.promise();

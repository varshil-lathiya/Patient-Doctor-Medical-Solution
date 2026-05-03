const db = require("../config/db.config");

async function createTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS receptionist_leaves (
      id INT AUTO_INCREMENT PRIMARY KEY,
      receptionist_id INT NOT NULL,
      from_date DATE NOT NULL,
      to_date DATE NOT NULL,
      reason TEXT,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      admin_remark TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (receptionist_id) REFERENCES staff(id)
    )
  `;

  try {
    await db.execute(query);
    console.log("✅ receptionist_leaves table created successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating table:", error);
    process.exit(1);
  }
}

createTable();

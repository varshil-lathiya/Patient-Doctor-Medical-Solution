const db = require("../config/db.config");

async function updateSchema() {
    try {
        console.log("Updating doctor_availability table schema...");
        
        // Add new columns
        await db.execute(`
            ALTER TABLE doctor_availability 
            ADD COLUMN morning_start TIME DEFAULT '10:00:00',
            ADD COLUMN morning_end TIME DEFAULT '13:00:00',
            ADD COLUMN evening_start TIME DEFAULT '15:00:00',
            ADD COLUMN evening_end TIME DEFAULT '18:00:00'
        `);

        // Migrate existing data if any
        await db.execute(`
            UPDATE doctor_availability 
            SET morning_start = start_time, 
                morning_end = end_time 
            WHERE start_time IS NOT NULL
        `);

        console.log("✅ Schema updated successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error updating schema:", error);
        process.exit(1);
    }
}

updateSchema();

const db = require("../config/db.config");

async function verifySlots() {
    try {
        const [slots] = await db.execute("SELECT slot_date, slot_start, slot_end FROM appointment_slots ORDER BY slot_date, slot_start");
        console.log(`Found ${slots.length} slots.`);
        if (slots.length > 0) {
            console.log("Sample slots:");
            console.table(slots.slice(0, 10));
            console.table(slots.slice(-10));
        }
        process.exit(0);
    } catch (error) {
        console.error("Error verifying slots:", error);
        process.exit(1);
    }
}

verifySlots();

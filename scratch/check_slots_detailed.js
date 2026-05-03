const db = require("../config/db.config");

async function checkSlots() {
    try {
        const [slots] = await db.execute("SELECT slot_date, slot_start, slot_end FROM appointment_slots WHERE slot_date = '2026-05-01' ORDER BY slot_start");
        console.log("Slots for 2026-05-01:");
        console.table(slots);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkSlots();

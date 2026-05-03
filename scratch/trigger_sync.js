const { syncAllDoctorSlots } = require("../utils/cron");

async function runSync() {
    try {
        console.log("Triggering slot synchronization...");
        await syncAllDoctorSlots();
        console.log("Sync triggered.");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

runSync();

const db = require('./config/db.config');
async function run() {
    try {
        // Delete specific duplicates for Sarah Anderson (id 5)
        console.log('Cleaning up duplicates for Sarah Anderson...');
        await db.execute('DELETE FROM doctor_details WHERE id IN (6, 13)');
        console.log('✅ Deleted detail records 6 and 13.');

        // General cleanup: remove any entry in doctor_details if a doctor already has one
        // But wait, some might have different departments? usually not in this app's logic.
        // Let's just fix Sarah for now as specifically requested.

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();

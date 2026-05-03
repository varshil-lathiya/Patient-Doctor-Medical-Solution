const db = require('./config/db.config');
async function run() {
    try {
        const [rows] = await db.execute('SELECT s.id, s.firstname, s.lastname, dd.department, COUNT(*) as count FROM staff s JOIN doctor_details dd ON s.id = dd.doctor_id GROUP BY s.id, s.firstname, s.lastname, dd.department HAVING count > 1');
        if (rows.length === 0) {
            console.log('✅ No more duplicates found in the entire database.');
        } else {
            console.log('Found duplicates:', JSON.stringify(rows, null, 2));
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();

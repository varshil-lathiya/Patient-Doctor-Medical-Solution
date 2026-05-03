const db = require('./config/db.config');
async function run() {
    try {
        const [rows] = await db.execute('SELECT s.id, s.firstname, s.lastname, dd.department, dd.id as detail_id FROM staff s JOIN doctor_details dd ON s.id = dd.doctor_id WHERE s.firstname LIKE "Sarah%" OR s.firstname LIKE "Sarah%"');
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();

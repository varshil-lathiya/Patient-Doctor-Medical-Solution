const db = require("../config/db.config");

async function fixMissingAvailability() {
    try {
        console.log("Checking for doctors missing availability records...");
        
        // Find all doctors (role_id = 2) who don't have a record in doctor_availability
        const [doctors] = await db.execute(`
            SELECT s.id, s.firstname, s.lastname 
            FROM staff s 
            LEFT JOIN doctor_availability da ON s.id = da.doctor_id 
            WHERE s.role_id = 2 AND da.doctor_id IS NULL
        `);

        if (doctors.length === 0) {
            console.log("No doctors missing availability records.");
            process.exit(0);
        }

        console.log(`Found ${doctors.length} doctors missing availability. Seeding defaults...`);

        for (const doc of doctors) {
            await db.execute(`
                INSERT INTO doctor_availability (doctor_id, morning_start, morning_end, evening_start, evening_end, duration) 
                VALUES (?, '10:00:00', '13:00:00', '15:00:00', '18:00:00', 30)
            `, [doc.id]);
            console.log(`✅ Fixed availability for Dr. ${doc.firstname} ${doc.lastname} (ID: ${doc.id})`);
        }

        console.log("Done.");
        process.exit(0);
    } catch (error) {
        console.error("Error fixing missing availability:", error);
        process.exit(1);
    }
}

fixMissingAvailability();

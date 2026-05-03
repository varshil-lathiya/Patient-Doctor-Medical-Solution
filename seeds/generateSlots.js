const db = require("../config/db.config");

/**
 * Generates slots for a specific doctor on a specific date if they don't already exist.
 */
const generateSlotsForDoctor = async (doctor_id, slot_date, start_time, end_time, duration) => {
    try {
        // Generate Slots
        let current = new Date(`${slot_date}T${start_time}`);
        const end = new Date(`${slot_date}T${end_time}`);
        let slotsCreated = 0;

        const now = new Date();
        const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        const currentTimeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        while (current < end) {
            const slot_start = current.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            current.setMinutes(current.getMinutes() + parseInt(duration));
            const slot_end = current.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            if (current > end) break;

            if (slot_date === todayStr && slot_start <= currentTimeStr) {
                continue;
            }

            // Check if this specific slot already exists
            const [existing] = await db.execute(
                "SELECT id FROM appointment_slots WHERE doctor_id = ? AND slot_date = ? AND slot_start = ?",
                [doctor_id, slot_date, slot_start]
            );

            if (existing.length === 0) {
                await db.execute(
                    "INSERT INTO appointment_slots (doctor_id, slot_date, slot_start, slot_end, status) VALUES (?, ?, ?, ?, 'is_available')",
                    [doctor_id, slot_date, slot_start, slot_end]
                );
                slotsCreated++;
            }
        }
        console.log(`✅ Generated ${slotsCreated} slots for Doctor ${doctor_id} on ${slot_date}`);
    } catch (error) {
        console.error(`❌ Error generating slots for Doctor ${doctor_id} on ${slot_date}:`, error);
    }
};

/**
 * Scans all doctors' availability and generates slots for the next 7 days.
 */
const syncAllDoctorSlots = async () => {
    console.log("\n" + "=".repeat(60));
    console.log("🕒 STARTING SLOT GENERATION");
    console.log("=".repeat(60) + "\n");

    try {
        const [availabilities] = await db.execute("SELECT * FROM doctor_availability");

        if (availabilities.length === 0) {
            console.log("⚠️  No doctor availability records found");
            process.exit(0);
        }

        console.log(`📋 Found ${availabilities.length} doctor(s) with availability\n`);

        for (const avail of availabilities) {
            const { doctor_id, morning_start, morning_end, evening_start, evening_end, duration } = avail;

            // Get doctor name
            const [doctor] = await db.execute(
                "SELECT firstname, lastname FROM staff WHERE id = ?",
                [doctor_id]
            );

            if (doctor.length > 0) {
                console.log(`\n👨‍⚕️  Processing: Dr. ${doctor[0].firstname} ${doctor[0].lastname} (ID: ${doctor_id})`);
                console.log(`   Schedule: Morning: ${morning_start} - ${morning_end}, Evening: ${evening_start} - ${evening_end} (${duration} min slots)`);
            }

            // Generate for today and next 6 days (total 7 days)
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const slot_date = date.toISOString().split('T')[0];

                if (morning_start && morning_end) {
                    await generateSlotsForDoctor(doctor_id, slot_date, morning_start, morning_end, duration);
                }
                
                if (evening_start && evening_end) {
                    await generateSlotsForDoctor(doctor_id, slot_date, evening_start, evening_end, duration);
                }
            }
        }

        // Show summary
        const [[{ totalSlots }]] = await db.execute("SELECT COUNT(*) as totalSlots FROM appointment_slots WHERE status = 'is_available'");

        console.log("\n" + "=".repeat(60));
        console.log("✨ SLOT GENERATION COMPLETED");
        console.log("=".repeat(60));
        console.log(`📊 Total Available Slots: ${totalSlots}`);
        console.log("=".repeat(60) + "\n");

        process.exit(0);
    } catch (error) {
        console.error("❌ Critical error in syncAllDoctorSlots:", error);
        process.exit(1);
    }
};

syncAllDoctorSlots();

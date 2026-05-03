const cron = require("node-cron");
const db = require("../config/db.config");

/**
 * Helper to get local date string (YYYY-MM-DD)
 */
const getLocalDateString = (date = new Date()) => {
    return date.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD
};

/**
 * Generates slots for a specific doctor on a specific date if they don't already exist.
 */
const generateSlotsForDoctor = async (doctor_id, slot_date, start_time, end_time, duration) => {
    try {
        const now = new Date();
        const todayStr = getLocalDateString(now);

        // 1. Skip past dates
        if (slot_date < todayStr) return;

        // 2. Check if the doctor is on approved leave for this date
        const [leaves] = await db.execute(
            "SELECT id FROM doctor_leaves WHERE doctor_id = ? AND status = 'approved' AND ? BETWEEN from_date AND to_date",
            [doctor_id, slot_date]
        );

        if (leaves.length > 0) {
            console.log(`Skipping slot generation for Doctor ${doctor_id} on ${slot_date} (Approved Leave)`);
            return;
        }

        // 3. Generate Slots
        let current = new Date(`${slot_date}T${start_time}`);
        const end = new Date(`${slot_date}T${end_time}`);

        while (current < end) {
            const slot_start = current.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            // Skip if slot has already passed (for today)
            if (slot_date === todayStr && slot_start <= now.toTimeString().split(' ')[0]) {
                current.setMinutes(current.getMinutes() + parseInt(duration));
                continue;
            }

            const nextSlot = new Date(current);
            nextSlot.setMinutes(nextSlot.getMinutes() + parseInt(duration));
            const slot_end = nextSlot.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            if (nextSlot > end) break;

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
            }

            current = nextSlot;
        }
        console.log(`✅ Generated slots for Doctor ${doctor_id} on ${slot_date}`);
    } catch (error) {
        console.error(`Error generating slots for Doctor ${doctor_id} on ${slot_date}:`, error);
    }
};

/**
 * Deletes available slots that have already passed their time.
 */
const cleanupExpiredSlots = async () => {
    try {
        const now = new Date();
        const today = getLocalDateString(now);
        const currentTime = now.toTimeString().split(' ')[0];

        // 1. Identify slots to be deleted (past dates OR today's past times)
        // Only target slots that are available, as occupied/completed slots should be kept for history
        const [slotsToClean] = await db.execute(
            "SELECT id FROM appointment_slots WHERE (status = 'is_available' OR status = '' OR status IS NULL) AND (slot_date < ? OR (slot_date = ? AND slot_start < ?))",
            [today, today, currentTime]
        );

        if (slotsToClean.length > 0) {
            const slotIds = slotsToClean.map(s => s.id);
            const placeholders = slotIds.map(() => '?').join(',');

            // 2. Delete any orphan vitals tied to these specific slots
            // (Vitals might exist if an appointment was recorded but then cancelled/rescheduled)
            await db.execute(
                `DELETE FROM patient_vitals WHERE slot_id IN (${placeholders})`,
                slotIds
            );

            // 3. Delete the slots themselves
            const [result] = await db.execute(
                `DELETE FROM appointment_slots WHERE id IN (${placeholders})`,
                slotIds
            );

            console.log(`🧹 Cleaned up ${result.affectedRows} expired slots and associated orphan vitals.`);
        }
    } catch (error) {
        console.error("Error during slot cleanup:", error);
    }
};

/**
 * Scans all doctors' availability and generates slots for the next 7 days.
 */
const syncAllDoctorSlots = async () => {
    console.log("🕒 Starting automated slot generation...");
    try {
        const [availabilities] = await db.execute("SELECT * FROM doctor_availability");

        for (const avail of availabilities) {
            const { doctor_id, morning_start, morning_end, evening_start, evening_end, duration } = avail;

            // Generate for today and next 6 days
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const slot_date = getLocalDateString(date);

                // Generate Morning Slots
                if (morning_start && morning_end) {
                    await generateSlotsForDoctor(doctor_id, slot_date, morning_start, morning_end, duration);
                }

                // Generate Evening Slots
                if (evening_start && evening_end) {
                    await generateSlotsForDoctor(doctor_id, slot_date, evening_start, evening_end, duration);
                }
            }
        }
        console.log("✨ Automated slot generation completed.");
    } catch (error) {
        console.error("Critical error in syncAllDoctorSlots:", error);
    }
};

/**
 * Initialize the cron job to run every day at midnight.
 */
const initCronJobs = () => {
    // Run at 00:00 every day
    cron.schedule("0 0 * * *", () => {
        syncAllDoctorSlots();
        cleanupExpiredSlots();
    });

    // Also run once on startup to ensure slots are up to date and clean
    cleanupExpiredSlots();
    syncAllDoctorSlots();
};

module.exports = { initCronJobs, generateSlotsForDoctor, syncAllDoctorSlots, cleanupExpiredSlots };

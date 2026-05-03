const db = require("./config/db.config");
const bcrypt = require("bcrypt");

async function seedSystemStaff() {
    const saltRounds = 10;

    const staffMembers = [
        {
            firstname: "System",
            lastname: "Admin",
            email: "admin@kalphospital.com",
            password: "adminpassword",
            role_id: 1, // Admin
            mobile: "9999999991",
            gender: "Male"
        },
        {
            firstname: "Jane",
            lastname: "Receptionist",
            email: "receptionist@kalphospital.com",
            password: "receptionistpassword",
            role_id: 3, // Receptionist
            mobile: "9999999993",
            gender: "Female"
        }
    ];

    try {
        console.log("Checking and seeding staff members...");

        for (const staff of staffMembers) {
            const [existing] = await db.execute("SELECT id FROM staff WHERE email = ?", [staff.email]);

            if (existing.length > 0) {
                console.log(`Staff with email ${staff.email} already exists.`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(staff.password, saltRounds);

            await db.execute(
                "INSERT INTO staff (firstname, lastname, email, password, role_id, mobile, gender) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [staff.firstname, staff.lastname, staff.email, hashedPassword, staff.role_id, staff.mobile, staff.gender]
            );

            console.log(`✅ Seeded ${staff.firstname} (${staff.email})`);
        }

        console.log("\nAccess Details:");
        staffMembers.forEach(s => {
            console.log(`Role: ${s.role_id === 1 ? 'Admin' : 'Receptionist'} | Email: ${s.email} | PW: ${s.password}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Error seeding staff:", error);
        process.exit(1);
    }
}

seedSystemStaff();

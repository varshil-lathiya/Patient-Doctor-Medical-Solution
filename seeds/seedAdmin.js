const db = require("../config/db.config");
const bcrypt = require("bcrypt");

async function seedAdmin() {
    const saltRounds = 10;

    const adminData = [
        {
            firstname: "System",
            lastname: "Admin",
            email: "admin@kalphospital.com",
            password: "pdms@123",
            role_id: 1, // Admin
            mobile: "7845847542",
            gender: "Male"
        }
    ];

    try {
        console.log("Checking and seeding admin user...");

        for (const admin of adminData) {
            const [existing] = await db.execute("SELECT id FROM staff WHERE email = ?", [admin.email]);

            if (existing.length > 0) {
                console.log(`Admin with email ${admin.email} already exists.`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(admin.password, saltRounds);

            await db.execute(
                "INSERT INTO staff (firstname, lastname, email, password, role_id, mobile, gender) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [admin.firstname, admin.lastname, admin.email, hashedPassword, admin.role_id, admin.mobile, admin.gender]
            );

            console.log(`✅ Seeded ${admin.firstname} (${admin.email})`);
        }

        console.log("\nAccess Details:");
        adminData.forEach(a => {
            console.log(`Role: Admin | Email: ${a.email} | PW: ${a.password}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Error seeding admin:", error);
        process.exit(1);
    }
}

seedAdmin();

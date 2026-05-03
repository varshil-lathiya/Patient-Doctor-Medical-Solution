const db = require("../config/db.config");
const bcrypt = require("bcrypt");

async function seedReceptionist() {
    const saltRounds = 10;
    const passwordRaw = "pdms@123";

    const receptionistData = [
        {
            firstname: "Jane",
            lastname: "Receptionist",
            email: "receptionist@kalphospital.com",
            password: passwordRaw,
            role_id: 3, // Receptionist
            mobile: "9999999993",
            gender: "Female"
        }
    ];

    try {
        console.log("Checking and seeding receptionist user...");

        for (const user of receptionistData) {
            const [existing] = await db.execute("SELECT id FROM staff WHERE email = ?", [user.email]);

            if (existing.length > 0) {
                console.log(`Receptionist with email ${user.email} already exists.`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(user.password, saltRounds);

            await db.execute(
                "INSERT INTO staff (firstname, lastname, email, password, role_id, mobile, gender) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [user.firstname, user.lastname, user.email, hashedPassword, user.role_id, user.mobile, user.gender]
            );

            console.log(`✅ Seeded ${user.firstname} (${user.email})`);
        }

        console.log("\nAccess Details:");
        receptionistData.forEach(r => {
            console.log(`Role: Receptionist | Email: ${r.email} | PW: ${r.password}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Error seeding receptionist:", error);
        process.exit(1);
    }
}

seedReceptionist();

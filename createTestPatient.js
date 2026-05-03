const db = require("./config/db.config");
const bcrypt = require("bcrypt");

async function createTestPatient() {
    const patientData = {
        firstname: "John",
        lastname: "Smith",
        email: "john.smith@example.com",
        mobile: "9123456789",
        gender: "Male",
        dob: "1990-03-20",
        blood_group: "A+",
        address: "456 Patient Street, City - 380002"
    };

    try {
        // Check if patient exists
        const [existing] = await db.execute("SELECT id FROM patients WHERE email = ?", [patientData.email]);
        if (existing.length > 0) {
            console.log("✅ Patient already exists");
            console.log("Email:", patientData.email);
            process.exit(0);
        }

        // Insert patient
        await db.execute(
            `INSERT INTO patients (firstname, lastname, email, mobile, gender, dob, blood_group, address) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                patientData.firstname,
                patientData.lastname,
                patientData.email,
                patientData.mobile,
                patientData.gender,
                patientData.dob,
                patientData.blood_group,
                patientData.address
            ]
        );

        console.log("✅ Test patient created successfully!");
        console.log("\n📋 Patient Details:");
        console.log("   Name:", `${patientData.firstname} ${patientData.lastname}`);
        console.log("   Email:", patientData.email);
        console.log("   Mobile:", patientData.mobile);
        console.log("   Gender:", patientData.gender);
        console.log("   Blood Group:", patientData.blood_group);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating patient:", error);
        process.exit(1);
    }
}

createTestPatient();

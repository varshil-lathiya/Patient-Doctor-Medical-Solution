const db = require("../config/db.config");
const bcrypt = require("bcrypt");

const doctors = [
    // Neurology
    { firstname: 'Rahul', lastname: 'Desai', email: 'rahul.desai@hospital.com', mobile: '9876543101', gender: 'Male', dob: '1980-05-15', blood_group: 'A+', department: 'Neurology', qualification: 'MD, DM Neurology', experience: 14, degree: 'MBBS, MD', rating_avg: 4.8, total_rating: 120 },
    { firstname: 'Ananya', lastname: 'Iyer', email: 'ananya.iyer@hospital.com', mobile: '9876543102', gender: 'Female', dob: '1985-08-22', blood_group: 'O+', department: 'Neurology', qualification: 'MD, DM Neurology', experience: 9, degree: 'MBBS, MD', rating_avg: 4.6, total_rating: 85 },
    { firstname: 'Vikram', lastname: 'Singh', email: 'vikram.singh@hospital.com', mobile: '9876543103', gender: 'Male', dob: '1975-11-10', blood_group: 'B+', department: 'Neurology', qualification: 'MD, DM Neurology', experience: 20, degree: 'MBBS, MD', rating_avg: 4.9, total_rating: 210 },

    // Orthopedics
    { firstname: 'Meera', lastname: 'Reddy', email: 'meera.reddy@hospital.com', mobile: '9876543104', gender: 'Female', dob: '1982-01-30', blood_group: 'AB+', department: 'Orthopedics', qualification: 'MS Orthopedics', experience: 12, degree: 'MBBS, MS', rating_avg: 4.7, total_rating: 95 },
    { firstname: 'Sanjay', lastname: 'Gupta', email: 'sanjay.gupta@hospital.com', mobile: '9876543105', gender: 'Male', dob: '1978-04-18', blood_group: 'O-', department: 'Orthopedics', qualification: 'MS Orthopedics', experience: 16, degree: 'MBBS, MS', rating_avg: 4.5, total_rating: 110 },
    { firstname: 'Rohan', lastname: 'Mehta', email: 'rohan.mehta@hospital.com', mobile: '9876543106', gender: 'Male', dob: '1988-09-05', blood_group: 'A-', department: 'Orthopedics', qualification: 'MS Orthopedics', experience: 7, degree: 'MBBS, MS', rating_avg: 4.6, total_rating: 60 },

    // Oncology
    { firstname: 'Sneha', lastname: 'Kapoor', email: 'sneha.kapoor@hospital.com', mobile: '9876543107', gender: 'Female', dob: '1981-12-12', blood_group: 'B-', department: 'Oncology', qualification: 'MD, DM Medical Oncology', experience: 13, degree: 'MBBS, MD', rating_avg: 4.8, total_rating: 140 },
    { firstname: 'Aditya', lastname: 'Verma', email: 'aditya.verma@hospital.com', mobile: '9876543108', gender: 'Male', dob: '1976-06-25', blood_group: 'O+', department: 'Oncology', qualification: 'MD, DM Surgical Oncology', experience: 18, degree: 'MBBS, MD', rating_avg: 4.9, total_rating: 190 },
    { firstname: 'Kavyesh', lastname: 'Nair', email: 'kavyesh.nair@hospital.com', mobile: '9876543109', gender: 'Male', dob: '1984-03-08', blood_group: 'A+', department: 'Oncology', qualification: 'MD, DM Medical Oncology', experience: 11, degree: 'MBBS, MD', rating_avg: 4.7, total_rating: 105 },

    // Pediatrics
    { firstname: 'Nandini', lastname: 'Rao', email: 'nandini.rao@hospital.com', mobile: '9876543110', gender: 'Female', dob: '1983-05-20', blood_group: 'AB-', department: 'Pediatrics', qualification: 'MD Pediatrics', experience: 10, degree: 'MBBS, MD', rating_avg: 4.9, total_rating: 220 },
    { firstname: 'Karan', lastname: 'Joshi', email: 'karan.joshi@hospital.com', mobile: '9876543111', gender: 'Male', dob: '1979-10-15', blood_group: 'O+', department: 'Pediatrics', qualification: 'MD Pediatrics', experience: 15, degree: 'MBBS, MD', rating_avg: 4.8, total_rating: 150 },
    { firstname: 'Pooja', lastname: 'Bhat', email: 'pooja.bhat@hospital.com', mobile: '9876543112', gender: 'Female', dob: '1987-02-28', blood_group: 'B+', department: 'Pediatrics', qualification: 'MD Pediatrics', experience: 8, degree: 'MBBS, MD', rating_avg: 4.7, total_rating: 90 },

    // Pulmonology
    { firstname: 'Arjun', lastname: 'Menon', email: 'arjun.menon@hospital.com', mobile: '9876543113', gender: 'Male', dob: '1980-07-07', blood_group: 'A+', department: 'Pulmonology', qualification: 'MD, DM Pulmonology', experience: 13, degree: 'MBBS, MD', rating_avg: 4.5, total_rating: 115 },
    { firstname: 'Riya', lastname: 'Shah', email: 'riya.shah@hospital.com', mobile: '9876543114', gender: 'Female', dob: '1985-04-12', blood_group: 'O-', department: 'Pulmonology', qualification: 'MD, DM Pulmonology', experience: 9, degree: 'MBBS, MD', rating_avg: 4.6, total_rating: 80 },
    { firstname: 'Vishal', lastname: 'Agarwal', email: 'vishal.agarwal@hospital.com', mobile: '9876543115', gender: 'Male', dob: '1977-11-22', blood_group: 'B+', department: 'Pulmonology', qualification: 'MD, DM Pulmonology', experience: 17, degree: 'MBBS, MD', rating_avg: 4.7, total_rating: 135 },

    // Rheumatology
    { firstname: 'Neha', lastname: 'Choudhary', email: 'neha.choudhary@hospital.com', mobile: '9876543116', gender: 'Female', dob: '1984-09-09', blood_group: 'AB+', department: 'Rheumatology', qualification: 'MD, DM Rheumatology', experience: 10, degree: 'MBBS, MD', rating_avg: 4.6, total_rating: 70 },
    { firstname: 'Gaurav', lastname: 'Mishra', email: 'gaurav.mishra@hospital.com', mobile: '9876543117', gender: 'Male', dob: '1981-02-14', blood_group: 'A-', department: 'Rheumatology', qualification: 'MD, DM Rheumatology', experience: 12, degree: 'MBBS, MD', rating_avg: 4.5, total_rating: 85 },
    { firstname: 'Shweta', lastname: 'Tiwari', email: 'shweta.tiwari@hospital.com', mobile: '9876543118', gender: 'Female', dob: '1986-06-30', blood_group: 'O+', department: 'Rheumatology', qualification: 'MD, DM Rheumatology', experience: 8, degree: 'MBBS, MD', rating_avg: 4.7, total_rating: 60 },

    // Gastroenterology
    { firstname: 'Prakash', lastname: 'Kumawat', email: 'prakash.kumawat@hospital.com', mobile: '9876543119', gender: 'Male', dob: '1976-03-25', blood_group: 'B-', department: 'Gastroenterology', qualification: 'MD, DM Gastroenterology', experience: 19, degree: 'MBBS, MD', rating_avg: 4.8, total_rating: 160 },
    { firstname: 'Anita', lastname: 'Pandey', email: 'anita.pandey@hospital.com', mobile: '9876543120', gender: 'Female', dob: '1982-10-10', blood_group: 'O+', department: 'Gastroenterology', qualification: 'MD, DM Gastroenterology', experience: 11, degree: 'MBBS, MD', rating_avg: 4.7, total_rating: 95 },
    { firstname: 'Rakesh', lastname: 'Yadav', email: 'rakesh.yadav@hospital.com', mobile: '9876543121', gender: 'Male', dob: '1988-01-18', blood_group: 'A+', department: 'Gastroenterology', qualification: 'MD, DM Gastroenterology', experience: 6, degree: 'MBBS, MD', rating_avg: 4.5, total_rating: 50 },

    // Ophthalmology
    { firstname: 'Divya', lastname: 'Shetty', email: 'divya.shetty@hospital.com', mobile: '9876543122', gender: 'Female', dob: '1983-07-28', blood_group: 'AB-', department: 'Ophthalmology', qualification: 'MS Ophthalmology', experience: 10, degree: 'MBBS, MS', rating_avg: 4.9, total_rating: 180 },
    { firstname: 'Ashok', lastname: 'Kumar', email: 'ashok.kumar@hospital.com', mobile: '9876543123', gender: 'Male', dob: '1979-12-05', blood_group: 'B+', department: 'Ophthalmology', qualification: 'MS Ophthalmology', experience: 16, degree: 'MBBS, MS', rating_avg: 4.8, total_rating: 145 },
    { firstname: 'Kavita', lastname: 'Jain', email: 'kavita.jain@hospital.com', mobile: '9876543124', gender: 'Female', dob: '1987-03-14', blood_group: 'O-', department: 'Ophthalmology', qualification: 'MS Ophthalmology', experience: 8, degree: 'MBBS, MS', rating_avg: 4.6, total_rating: 75 },

    // Nephrology
    { firstname: 'Siddharth', lastname: 'Mukherjee', email: 'siddharth.mukherjee@hospital.com', mobile: '9876543125', gender: 'Male', dob: '1981-05-02', blood_group: 'A+', department: 'Nephrology', qualification: 'MD, DM Nephrology', experience: 14, degree: 'MBBS, MD', rating_avg: 4.7, total_rating: 110 },
    { firstname: 'Aarti', lastname: 'Kulkarni', email: 'aarti.kulkarni@hospital.com', mobile: '9876543126', gender: 'Female', dob: '1985-09-19', blood_group: 'O+', department: 'Nephrology', qualification: 'MD, DM Nephrology', experience: 9, degree: 'MBBS, MD', rating_avg: 4.5, total_rating: 65 },
    { firstname: 'Manish', lastname: 'Garg', email: 'manish.garg@hospital.com', mobile: '9876543127', gender: 'Male', dob: '1975-08-11', blood_group: 'B+', department: 'Nephrology', qualification: 'MD, DM Nephrology', experience: 21, degree: 'MBBS, MD', rating_avg: 4.8, total_rating: 175 },

    // Otorhinolaryngology (ENT)
    { firstname: 'Sonal', lastname: 'Chauhan', email: 'sonal.chauhan@hospital.com', mobile: '9876543128', gender: 'Female', dob: '1986-11-25', blood_group: 'AB+', department: 'Otorhinolaryngology (ENT)', qualification: 'MS ENT', experience: 8, degree: 'MBBS, MS', rating_avg: 4.6, total_rating: 85 },
    { firstname: 'Deepak', lastname: 'Sharma', email: 'deepak.sharma@hospital.com', mobile: '9876543129', gender: 'Male', dob: '1980-04-09', blood_group: 'O-', department: 'Otorhinolaryngology (ENT)', qualification: 'MS ENT', experience: 14, degree: 'MBBS, MS', rating_avg: 4.7, total_rating: 105 },
    { firstname: 'Ritu', lastname: 'Banerjee', email: 'ritu.banerjee@hospital.com', mobile: '9876543130', gender: 'Female', dob: '1989-01-05', blood_group: 'A-', department: 'Otorhinolaryngology (ENT)', qualification: 'MS ENT', experience: 6, degree: 'MBBS, MS', rating_avg: 4.5, total_rating: 50 },

    // Emergency
    { firstname: 'Alok', lastname: 'Nath', email: 'alok.nath@hospital.com', mobile: '9876543131', gender: 'Male', dob: '1982-06-16', blood_group: 'B-', department: 'Emergency', qualification: 'MD Emergency Medicine', experience: 13, degree: 'MBBS, MD', rating_avg: 4.9, total_rating: 230 },
    { firstname: 'Nisha', lastname: 'Das', email: 'nisha.das@hospital.com', mobile: '9876543132', gender: 'Female', dob: '1985-12-03', blood_group: 'O+', department: 'Emergency', qualification: 'MD Emergency Medicine', experience: 10, degree: 'MBBS, MD', rating_avg: 4.8, total_rating: 195 },
    { firstname: 'Harish', lastname: 'Rao', email: 'harish.rao@hospital.com', mobile: '9876543133', gender: 'Male', dob: '1978-02-27', blood_group: 'A+', department: 'Emergency', qualification: 'MD Emergency Medicine', experience: 16, degree: 'MBBS, MD', rating_avg: 4.7, total_rating: 165 },

    // Cardiology (Just to be safe based on seedDoctor.js context)
    { firstname: 'Vinay', lastname: 'Kamat', email: 'vinay.kamat@hospital.com', mobile: '9876543134', gender: 'Male', dob: '1975-03-12', blood_group: 'O+', department: 'Cardiology', qualification: 'MD, DM Cardiology', experience: 18, degree: 'MBBS, MD', rating_avg: 4.9, total_rating: 240 },
    { firstname: 'Smriti', lastname: 'Menon', email: 'smriti.menon@hospital.com', mobile: '9876543135', gender: 'Female', dob: '1984-08-30', blood_group: 'A-', department: 'Cardiology', qualification: 'MD, DM Cardiology', experience: 11, degree: 'MBBS, MD', rating_avg: 4.8, total_rating: 155 },
    { firstname: 'Gautam', lastname: 'Bose', email: 'gautam.bose@hospital.com', mobile: '9876543136', gender: 'Male', dob: '1980-11-19', blood_group: 'B+', department: 'Cardiology', qualification: 'MD, DM Cardiology', experience: 14, degree: 'MBBS, MD', rating_avg: 4.7, total_rating: 130 }
];

async function seedDoctors() {
    console.log('\n🏥 Starting to seed all department doctors...\n');

    try {
        const passwordHash = await bcrypt.hash("pdms@123", 10);

        for (const doctor of doctors) {
            // Check if doctor already exists
            const [existing] = await db.execute(
                "SELECT id FROM staff WHERE email = ?",
                [doctor.email]
            );

            if (existing.length > 0) {
                console.log(`⏭️  ${doctor.firstname} ${doctor.lastname} (${doctor.department}) already exists`);
                continue;
            }

            // Insert into staff table
            const [staffResult] = await db.execute(
                "INSERT INTO staff (firstname, lastname, email, password, role_id, mobile, gender, dob, blood_group, is_deleted) VALUES (?, ?, ?, ?, 2, ?, ?, ?, ?, 0)",
                [doctor.firstname, doctor.lastname, doctor.email, passwordHash, doctor.mobile, doctor.gender, doctor.dob, doctor.blood_group]
            );

            const doctorId = staffResult.insertId;

            // Insert into doctor_details table
            await db.execute(
                "INSERT INTO doctor_details (doctor_id, department, qualification, experience, degree, rating_avg, total_rating) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [doctorId, doctor.department, doctor.qualification, doctor.experience, doctor.degree, doctor.rating_avg, doctor.total_rating]
            );

            // Set default availability
            await db.execute(
                "INSERT INTO doctor_availability (doctor_id, morning_start, morning_end, evening_start, evening_end, duration, start_time, end_time, max_seats) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [doctorId, '10:00:00', '13:00:00', '15:00:00', '18:00:00', 30, '10:00:00', '18:00:00', 15]
            );

            console.log(`✅ Added Dr. ${doctor.firstname} ${doctor.lastname} - ${doctor.department}`);
        }

        // Show summary
        console.log('\n' + '='.repeat(60));
        const [departments] = await db.execute("SELECT DISTINCT department FROM doctor_details ORDER BY department");
        console.log(`\n📊 Total Departments: ${departments.length}`);
        console.log('\nDepartments:');
        departments.forEach(dept => console.log(`   - ${dept.department}`));
        console.log('\n' + '='.repeat(60));
        console.log('✨ All doctors added successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding doctors:', error);
        process.exit(1);
    }
}

seedDoctors();

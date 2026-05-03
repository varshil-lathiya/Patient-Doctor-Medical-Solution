const jwt = require("jsonwebtoken");
const db = require("../config/db.config");

const protect = async (req, res, next) => {
    let token;

    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.redirect("/session-expired"); // Redirect to a general login or based on route
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role === "patient") {
            const [rows] = await db.execute("SELECT * FROM patients WHERE id = ?", [decoded.id]);
            if (rows.length === 0) return res.redirect("/patient/login");
            req.user = rows[0];
            req.user.role = "patient";
        } else {
            // For staff, join with doctor_details if they are a doctor (role_id 2)
            const [rows] = await db.execute(`
                SELECT s.*, dd.department, dd.degree, dd.qualification, dd.experience, dd.consultation_fee, dd.rating 
                FROM staff s 
                LEFT JOIN doctor_details dd ON s.id = dd.doctor_id 
                WHERE s.id = ?
            `, [decoded.id]);

            if (rows.length === 0) return res.redirect("/session-expired");
            req.user = rows[0];
            // Map role_id to string for easier use
            const roles = { 1: "admin", 2: "doctor", 3: "receptionist" };
            req.user.role = roles[req.user.role_id];
        }

        res.locals.user = req.user;
        next();
    } catch (error) {
        console.error("Auth error:", error);
        res.clearCookie("token");
        return res.redirect("/session-expired");
    }
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).send("You do not have permission to perform this action");
        }
        next();
    };
};

module.exports = { protect, restrictTo };

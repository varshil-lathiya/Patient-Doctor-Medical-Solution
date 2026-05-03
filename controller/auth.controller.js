const db = require("../config/db.config");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const staffLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.execute("SELECT * FROM staff WHERE email = ? AND is_deleted = 0", [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const staff = rows[0];
        const isMatch = await bcrypt.compare(password, staff.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: staff.id, role: staff.role_id === 1 ? "admin" : staff.role_id === 2 ? "doctor" : "receptionist" },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            message: "Login successful",
            role: staff.role_id === 1 ? "admin" : staff.role_id === 2 ? "doctor" : "receptionist",
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const logout = (req, res) => {
    res.clearCookie("token");
    res.redirect("/staff/login");
};

module.exports = { staffLogin, logout };

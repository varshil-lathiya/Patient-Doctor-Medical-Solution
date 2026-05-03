const express = require("express");
const { staffLogin, logout } = require("../controller/auth.controller");
const { authRedirect } = require("../middleware/authRedirect.middleware");
const router = express.Router();

router.get("/staff/login", authRedirect, (req, res) => {
    res.render("auth/staff_login");
});

router.post("/staff/login", staffLogin);
router.get("/logout", logout);

module.exports = router;

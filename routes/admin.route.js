const express = require("express");
const adminController = require("../controller/admin.controller.js");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

// Apply protection to all admin routes
router.use(protect);
router.use(restrictTo("admin"));

// Dashboard & Lists
router.get("/dashboard", adminController.dashboard);
router.get("/doctors", adminController.doctors_list);
router.get("/receptionist", adminController.receptionist_list);

// Staff Management
router.get("/staff/:id", adminController.getStaffById);
router.post("/add-staff", adminController.addStaff);
router.post("/update-staff/:id", adminController.updateStaff);
router.delete("/delete-staff/:id", adminController.deleteStaff);

// Leave Management
router.get("/manage-leaves", adminController.manageLeaves);
router.post("/update-leave-status", adminController.updateLeaveStatus);

module.exports = router;

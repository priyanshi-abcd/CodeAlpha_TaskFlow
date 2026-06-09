const express = require("express");
const router = express.Router();
const {protect} = require("../middleware/auth");
const {register,login,updateProfile,changePassword,forgotPasswordRequest,resetPasswordVerify} = require("../controllers/authController");

router.post("/register",register);
router.post("/login",login);
router.put("/profile",protect,updateProfile);
router.put("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPasswordRequest);
router.post("/reset-password/:token", resetPasswordVerify);

module.exports = router;
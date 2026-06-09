const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

exports.register = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const normalizedEmail = email.toLowerCase().trim();
        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(400).json({ message: "You are already registred please login" });
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashPassword
        });
        const userResponse = { id: user.id, name: user.name, email: user.email };
        return res.status(201).json(userResponse);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({ message: "User Not Found Register First" });
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Password Not Matched" });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "fallback_secret", {
            expiresIn: "30d"
        });
        return res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ message: "Name field cannot be empty." });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { name: name.trim() },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: "User node not found." });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error in updateProfile controller:", error);
        res.status(500).json({ message: "Internal server error structural fault." });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Both current and new passwords are required." });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters long." });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect current password." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Error in changePassword controller:", error);
        res.status(500).json({ message: "Internal server error during password shift." });
    }
};

exports.forgotPasswordRequest = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email field is required." });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "No account found with this email address." });
        }

        const resetToken = crypto.randomBytes(20).toString("hex");

        user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes lifespan
        await user.save();

        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        console.log("Checking Env Variables:", process.env.EMAIL_USER, process.env.EMAIL_PASS ? "Password Loaded" : "Password Empty");
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER.trim(),
                pass: process.env.EMAIL_PASS.trim(), 
            },
        });

        const mailOptions = {
            from: `"TaskFlow Support" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "TaskFlow Account Password Reset Verification Link",
            html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Password Reset Request Received</h2>
          <p>We received a request to update the credentials mapped to your TaskFlow account.</p>
          <p>Click the secure link below to proceed. This action shell expires in 10 minutes:</p>
          <div style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset My Password</a>
          </div>
          <p style="font-size: 11px; color: #666;">If the button doesn't work, copy-paste this raw terminal URL into your web browser:</p>
          <p style="font-size: 11px; color: #2563eb;">${resetUrl}</p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Secure reset link broadcasted to your email address successfully." });

    } catch (error) {
        console.error("Error in forgotPasswordRequest controller:", error);
        res.status(500).json({ message: "Internal server error during reset link delivery tracking." });
    }
};

exports.resetPasswordVerify = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long." });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "This confirmation verification link is invalid or has expired." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ message: "Your account credentials have been reset. You can now securely log in." });

    } catch (error) {
        console.error("Error in resetPasswordVerify controller:", error);
        res.status(500).json({ message: "Internal server error structural processing fault." });
    }
};
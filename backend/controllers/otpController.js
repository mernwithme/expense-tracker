import crypto from 'crypto';
import Otp from '../models/Otp.js';
import User from '../models/User.js';
import { sendOtpEmail } from '../services/emailService.js';

/**
 * Generate a random 6-digit OTP
 */
const generateOtp = () => {
    return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send OTP to user's email
 * POST /api/auth/send-otp
 */
export const sendOtp = async (req, res) => {
    try {
        const { email, name } = req.body;

        // Check if email is already registered
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered.'
            });
        }

        // Delete any previous OTP records for this email
        await Otp.deleteMany({ email: email.toLowerCase() });

        // Generate new OTP
        const otp = generateOtp();

        // Store OTP in database with 5-minute expiry
        const otpRecord = new Otp({
            email: email.toLowerCase(),
            otp,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            verified: false,
            attempts: 1,
            lastSentAt: new Date()
        });

        await otpRecord.save();
        console.log(`📧 OTP generated for ${email}: ${otp}`);

        // Send OTP email
        await sendOtpEmail(email, name, otp);

        res.status(200).json({
            success: true,
            message: 'Verification code sent to your email.'
        });

    } catch (error) {
        console.error('❌ Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error sending verification code.'
        });
    }
};

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 */
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find OTP record
        const otpRecord = await Otp.findOne({ email: email.toLowerCase() });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'No verification code found. Please request a new code.'
            });
        }

        // Check if OTP has expired
        if (new Date() > otpRecord.expiresAt) {
            // Delete expired OTP
            await Otp.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({
                success: false,
                message: 'Verification code expired. Please request a new code.'
            });
        }

        // Check if OTP matches
        if (otpRecord.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code.'
            });
        }

        // Mark as verified
        otpRecord.verified = true;
        await otpRecord.save();

        console.log(`✅ Email verified: ${email}`);

        res.status(200).json({
            success: true,
            message: 'Email verified successfully.'
        });

    } catch (error) {
        console.error('❌ Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying code.'
        });
    }
};

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 */
export const resendOtp = async (req, res) => {
    try {
        const { email, name } = req.body;

        // Check if email is already registered
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered.'
            });
        }

        // Find existing OTP record
        const otpRecord = await Otp.findOne({ email: email.toLowerCase() });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'No verification request found. Please start the registration process again.'
            });
        }

        // Check maximum resend attempts (3 total including initial send)
        if (otpRecord.attempts >= 3) {
            return res.status(429).json({
                success: false,
                message: 'Maximum resend attempts reached. Please try again later.'
            });
        }

        // Check 60-second cooldown
        const timeSinceLastSend = Date.now() - new Date(otpRecord.lastSentAt).getTime();
        const cooldownMs = 60 * 1000; // 60 seconds
        if (timeSinceLastSend < cooldownMs) {
            const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastSend) / 1000);
            return res.status(429).json({
                success: false,
                message: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
                remainingSeconds
            });
        }

        // Generate new OTP
        const newOtp = generateOtp();

        // Update the record with new OTP
        otpRecord.otp = newOtp;
        otpRecord.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        otpRecord.attempts += 1;
        otpRecord.lastSentAt = new Date();
        otpRecord.verified = false;

        await otpRecord.save();
        console.log(`📧 OTP resent for ${email}: ${newOtp} (attempt ${otpRecord.attempts})`);

        // Send new OTP email
        await sendOtpEmail(email, name || '', newOtp);

        res.status(200).json({
            success: true,
            message: 'New verification code sent to your email.',
            remainingAttempts: 3 - otpRecord.attempts
        });

    } catch (error) {
        console.error('❌ Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error resending verification code.'
        });
    }
};

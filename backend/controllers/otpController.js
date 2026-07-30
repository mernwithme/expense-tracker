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
    const totalTimer = `⏱️ Total_SendOtp_Request_${Date.now()}`;
    console.time(totalTimer);
    try {
        const { email, name } = req.body;
        const normalizedEmail = email.toLowerCase();

        // 1. Check existing user
        console.time('⏱️ DB_UserCheck');
        const existingUser = await User.findOne({ email: normalizedEmail });
        console.timeEnd('⏱️ DB_UserCheck');

        if (existingUser) {
            console.timeEnd(totalTimer);
            return res.status(400).json({
                success: false,
                message: 'This email is already registered.'
            });
        }

        // 2. Delete previous OTP records
        console.time('⏱️ DB_OtpDelete');
        await Otp.deleteMany({ email: normalizedEmail });
        console.timeEnd('⏱️ DB_OtpDelete');

        // 3. Generate and store new OTP
        const otp = generateOtp();
        const otpRecord = new Otp({
            email: normalizedEmail,
            otp,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            verified: false,
            attempts: 1,
            lastSentAt: new Date()
        });

        console.time('⏱️ DB_OtpSave');
        await otpRecord.save();
        console.timeEnd('⏱️ DB_OtpSave');

        console.log(`📧 OTP generated & saved in DB for ${normalizedEmail}: ${otp}`);

        // 4. Dispatch email in background (non-blocking for ultra-fast response)
        sendOtpEmail(normalizedEmail, name, otp).catch(err => {
            console.error(`❌ Background OTP email dispatch error for ${normalizedEmail}:`, err.message);
        });

        console.timeEnd(totalTimer);
        res.status(200).json({
            success: true,
            message: 'Verification code sent to your email.'
        });

    } catch (error) {
        console.timeEnd(totalTimer);
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
        const normalizedEmail = email.toLowerCase();

        console.time('⏱️ DB_OtpVerifyFetch');
        const otpRecord = await Otp.findOne({ email: normalizedEmail });
        console.timeEnd('⏱️ DB_OtpVerifyFetch');

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'No verification code found. Please request a new code.'
            });
        }

        if (new Date() > otpRecord.expiresAt) {
            await Otp.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({
                success: false,
                message: 'Verification code expired. Please request a new code.'
            });
        }

        if (otpRecord.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code.'
            });
        }

        otpRecord.verified = true;
        await otpRecord.save();

        console.log(`✅ Email verified: ${normalizedEmail}`);

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
    const totalTimer = `⏱️ Total_ResendOtp_Request_${Date.now()}`;
    console.time(totalTimer);
    try {
        const { email, name } = req.body;
        if (!email) {
            console.timeEnd(totalTimer);
            return res.status(400).json({
                success: false,
                message: 'Email address is required.'
            });
        }
        const normalizedEmail = email.toLowerCase();

        console.time('⏱️ DB_ResendUserCheck');
        const existingUser = await User.findOne({ email: normalizedEmail });
        console.timeEnd('⏱️ DB_ResendUserCheck');

        if (existingUser) {
            console.timeEnd(totalTimer);
            return res.status(400).json({
                success: false,
                message: 'This email is already registered.'
            });
        }

        let otpRecord = await Otp.findOne({ email: normalizedEmail });

        if (!otpRecord) {
            // Create a fresh OTP record if expired or not found
            const newOtp = generateOtp();
            otpRecord = new Otp({
                email: normalizedEmail,
                otp: newOtp,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                verified: false,
                attempts: 1,
                lastSentAt: new Date()
            });

            console.time('⏱️ DB_ResendOtpSave');
            await otpRecord.save();
            console.timeEnd('⏱️ DB_ResendOtpSave');

            console.log(`📧 Fresh OTP created & sent for ${normalizedEmail}: ${newOtp}`);

            sendOtpEmail(normalizedEmail, name || '', newOtp).catch(err => {
                console.error(`❌ Background resend OTP email error for ${normalizedEmail}:`, err.message);
            });

            console.timeEnd(totalTimer);
            return res.status(200).json({
                success: true,
                message: 'New verification code sent to your email.',
                remainingAttempts: 2
            });
        }

        if (otpRecord.attempts >= 3) {
            console.timeEnd(totalTimer);
            return res.status(429).json({
                success: false,
                message: 'Maximum resend attempts reached. Please try again later.'
            });
        }

        const timeSinceLastSend = Date.now() - new Date(otpRecord.lastSentAt).getTime();
        const cooldownMs = 60 * 1000;
        if (timeSinceLastSend < cooldownMs) {
            const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastSend) / 1000);
            console.timeEnd(totalTimer);
            return res.status(429).json({
                success: false,
                message: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
                remainingSeconds
            });
        }

        const newOtp = generateOtp();

        otpRecord.otp = newOtp;
        otpRecord.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        otpRecord.attempts += 1;
        otpRecord.lastSentAt = new Date();
        otpRecord.verified = false;

        console.time('⏱️ DB_ResendOtpSave');
        await otpRecord.save();
        console.timeEnd('⏱️ DB_ResendOtpSave');

        console.log(`📧 OTP resent for ${normalizedEmail}: ${newOtp} (attempt ${otpRecord.attempts})`);

        sendOtpEmail(normalizedEmail, name || '', newOtp).catch(err => {
            console.error(`❌ Background resend OTP email error for ${normalizedEmail}:`, err.message);
        });

        console.timeEnd(totalTimer);
        res.status(200).json({
            success: true,
            message: 'New verification code sent to your email.',
            remainingAttempts: 3 - otpRecord.attempts
        });

    } catch (error) {
        console.timeEnd(totalTimer);
        console.error('❌ Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error resending verification code.'
        });
    }
};

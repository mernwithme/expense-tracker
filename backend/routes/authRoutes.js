import express from 'express';
import { register, login, refreshToken, logout, getProfile } from '../controllers/authController.js';
import { sendOtp, verifyOtp, resendOtp } from '../controllers/otpController.js';
import { authenticateToken, authenticateRefreshToken } from '../middleware/authMiddleware.js';
import { validate, registerValidation, loginValidation, sendOtpValidation, verifyOtpValidation, resendOtpValidation } from '../middleware/validateMiddleware.js';

const router = express.Router();

// OTP verification routes (public)
router.post('/send-otp', validate(sendOtpValidation), sendOtp);
router.post('/verify-otp', validate(verifyOtpValidation), verifyOtp);
router.post('/resend-otp', validate(resendOtpValidation), resendOtp);

// Auth routes
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/refresh', authenticateRefreshToken, refreshToken);
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);

export default router;

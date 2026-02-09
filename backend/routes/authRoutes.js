import express from 'express';
import { register, login, refreshToken, logout, getProfile } from '../controllers/authController.js';
import { authenticateToken, authenticateRefreshToken } from '../middleware/authMiddleware.js';
import { validate, registerValidation, loginValidation } from '../middleware/validateMiddleware.js';

const router = express.Router();
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/refresh', authenticateRefreshToken, refreshToken);
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);

export default router;

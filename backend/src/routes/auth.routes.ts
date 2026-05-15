// ============================================================
// src/routes/auth.routes.ts
// Auth routes: /api/auth/register, /api/auth/login, /api/auth/me
// ============================================================

import { Router } from 'express';
import { register, login, getMe, forgotPassword, verifyOtp, resetPassword } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// POST /api/auth/register — create a new student account
router.post('/register', register);

// POST /api/auth/login — login (student or admin)
router.post('/login', login);

// GET /api/auth/me — get current user (protected)
router.get('/me', verifyToken, getMe);

// POST /api/auth/forgot-password — request OTP
router.post('/forgot-password', forgotPassword);

// POST /api/auth/verify-otp — verify OTP
router.post('/verify-otp', verifyOtp);

// POST /api/auth/reset-password — verify OTP and update password
router.post('/reset-password', resetPassword);

export default router;

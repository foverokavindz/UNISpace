// ============================================================
// src/routes/session.routes.ts
// Routes for live study sessions (Jitsi meetings)
// ============================================================

import { Router } from 'express';
import {
  createSession,
  getSessions,
  getSessionById,
  joinSession,
  deleteSession
} from '../controllers/session.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// All session routes require authentication
router.use(verifyToken);

// Create a session (any authenticated user)
router.post('/', createSession);

// List upcoming / active sessions
router.get('/', getSessions);

// Get single session with participants
router.get('/:id', getSessionById);

// Join a session
router.post('/:id/join', joinSession);

// Host cancels their session
router.delete('/:id', deleteSession);

export default router;

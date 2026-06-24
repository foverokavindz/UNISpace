// ============================================================
// src/routes/comment.routes.ts
// Routes for per-resource discussion comments
// ============================================================

import { Router } from 'express';
import { getComments, postComment } from '../controllers/comment.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// All comment routes require authentication
router.use(verifyToken);

// GET  /api/resources/:resourceId/comments — list comments
router.get('/:resourceId/comments', getComments);

// POST /api/resources/:resourceId/comments — add a comment
router.post('/:resourceId/comments', postComment);

export default router;

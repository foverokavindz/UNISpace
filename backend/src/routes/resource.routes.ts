// ============================================================
// src/routes/resource.routes.ts
// Routes for handling resource operations
// ============================================================

import { Router } from 'express';
import { upload, uploadResource, getResources, deleteResource, renameResource, getDashboardStats } from '../controllers/resource.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Ensure all operations are protected by authentication
router.use(verifyToken);

// GET /api/resources/stats - Get dashboard statistics (admin only)
router.get('/stats', requireRole('admin'), getDashboardStats);

// GET /api/resources - Get resources by query filters (student and admin)
router.get('/', getResources);

// POST /api/resources/upload - Upload a single resource file (admin only)
router.post('/upload', requireRole('admin'), upload.single('file'), uploadResource);

// PATCH /api/resources/:id/rename - Rename a resource (admin only)
router.patch('/:id/rename', requireRole('admin'), renameResource);

// DELETE /api/resources/:id - Delete a resource (admin only)
router.delete('/:id', requireRole('admin'), deleteResource);

export default router;


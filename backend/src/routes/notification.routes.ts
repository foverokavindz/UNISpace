import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notification.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all routes in this file
router.use(verifyToken);

router.get('/', getNotifications);
router.patch('/read', markAsRead);

export default router;

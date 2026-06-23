import { Response } from 'express';
import { sql, getPool } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiResponse } from '../types';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(<ApiResponse>{ success: false, message: 'Unauthorized' });
      return;
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT id, message, resource_path, is_read, created_at 
        FROM notifications 
        WHERE user_id = @user_id 
        ORDER BY created_at DESC
      `);

    res.status(200).json(<ApiResponse<any>>{
      success: true,
      message: 'Notifications retrieved successfully.',
      data: result.recordset
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(<ApiResponse>{ success: false, message: 'Unauthorized' });
      return;
    }

    const pool = await getPool();
    await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        UPDATE notifications 
        SET is_read = 1 
        WHERE user_id = @user_id AND is_read = 0
      `);

    res.status(200).json(<ApiResponse>{
      success: true,
      message: 'Notifications marked as read.'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

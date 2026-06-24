// ============================================================
// src/controllers/comment.controller.ts
// Handles per-resource discussion comments (GET + POST)
// ============================================================

import { Response } from 'express';
import { sql, getPool } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiResponse } from '../types';

// ----------------------------------------------------------
// GET /api/resources/:resourceId/comments
// Fetch all comments for a specific resource, newest first
// ----------------------------------------------------------
export const getComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resourceId = parseInt(req.params.resourceId, 10);
    if (isNaN(resourceId)) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Invalid resource ID.' });
      return;
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT
          c.id,
          c.resource_id,
          c.user_id,
          c.message,
          c.created_at,
          u.full_name,
          u.student_id
        FROM resource_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.resource_id = @resourceId
        ORDER BY c.created_at ASC
      `);

    res.status(200).json(<ApiResponse<any>>{ 
      success: true, 
      message: 'Comments retrieved.',
      data: result.recordset 
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// POST /api/resources/:resourceId/comments
// Post a new comment on a resource
// Body: { message: string }
// ----------------------------------------------------------
export const postComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resourceId = parseInt(req.params.resourceId, 10);
    const userId = req.user?.userId;
    const { message } = req.body;

    if (isNaN(resourceId)) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Invalid resource ID.' });
      return;
    }

    if (!userId) {
      res.status(401).json(<ApiResponse>{ success: false, message: 'Not authenticated.' });
      return;
    }

    if (!message || !message.trim()) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Message cannot be empty.' });
      return;
    }

    const pool = await getPool();

    // Insert the comment and get its ID back
    const insertResult = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .input('userId', sql.Int, userId)
      .input('message', sql.NVarChar(sql.MAX), message.trim())
      .query(`
        INSERT INTO resource_comments (resource_id, user_id, message)
        OUTPUT INSERTED.id, INSERTED.created_at
        VALUES (@resourceId, @userId, @message)
      `);

    const inserted = insertResult.recordset[0];

    // Fetch the full comment with user info to return
    const commentResult = await pool.request()
      .input('commentId', sql.Int, inserted.id)
      .query(`
        SELECT
          c.id,
          c.resource_id,
          c.user_id,
          c.message,
          c.created_at,
          u.full_name,
          u.student_id
        FROM resource_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = @commentId
      `);

    res.status(201).json(<ApiResponse<any>>{
      success: true,
      message: 'Comment posted.',
      data: commentResult.recordset[0],
    });
  } catch (error) {
    console.error('Post comment error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ============================================================
// src/controllers/resource.controller.ts
// Controller for resource upload, retrieval, and deletion
// ============================================================

import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sql, getPool } from '../config/database';
import { ApiResponse } from '../types';

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save to backend/uploads directory
    const uploadDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename suffix to prevent naming collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Create Multer upload middleware
export const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024 * 10,  // 10GB file size limit
  }
});

// ----------------------------------------------------------
// POST /api/resources/upload
// ----------------------------------------------------------
export const uploadResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    const { level, semester, subject, category } = req.body;

    if (!file) {
      res.status(400).json(<ApiResponse>{
        success: false,
        message: 'No file was uploaded.',
      });
      return;
    }

    if (!level || !semester || !subject || !category) {
      // Clean up uploaded file if validation fails
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      res.status(400).json(<ApiResponse>{
        success: false,
        message: 'Missing required fields: level, semester, subject, or category.',
      });
      return;
    }

    const title = file.originalname;
    const description = '';
    const relativePath = `uploads/${file.filename}`;

    const pool = await getPool();
    const result = await pool.request()
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('file_path', sql.NVarChar(500), relativePath)
      .input('original_name', sql.NVarChar(255), file.originalname)
      .input('mime_type', sql.NVarChar(100), file.mimetype)
      .input('level', sql.NVarChar(50), level)
      .input('semester', sql.NVarChar(50), semester)
      .input('subject', sql.NVarChar(50), subject)
      .input('category', sql.NVarChar(50), category)
      .query(`
        INSERT INTO resources (title, description, file_path, original_name, mime_type, level, semester, subject, category)
        OUTPUT INSERTED.id
        VALUES (@title, @description, @file_path, @original_name, @mime_type, @level, @semester, @subject, @category)
      `);

    const newId = result.recordset[0].id;

    // Create notification for all students
    try {
      const message = `New resource uploaded: "${title}" | Level: ${level} | Semester: ${semester} | Subject: ${subject} | Folder: ${category}`;
      await pool.request()
        .input('message', sql.NVarChar(500), message)
        .input('resource_path', sql.NVarChar(500), relativePath)
        .query(`
          INSERT INTO notifications (user_id, message, resource_path)
          SELECT id, @message, @resource_path FROM users WHERE role = 'student'
        `);
    } catch (notifErr) {
      console.error('Failed to insert notifications:', notifErr);
    }

    res.status(201).json(<ApiResponse<any>>{
      success: true,
      message: 'Resource uploaded successfully.',
      data: {
        id: newId,
        title,
        file_path: relativePath,
        original_name: file.originalname,
        mime_type: file.mimetype,
        level,
        semester,
        subject,
        category,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Upload resource error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// GET /api/resources
// ----------------------------------------------------------
export const getResources = async (req: Request, res: Response): Promise<void> => {
  try {
    const { level, semester, subject, category } = req.query;

    const pool = await getPool();
    let query = 'SELECT * FROM resources WHERE 1=1';
    const request = pool.request();

    if (level) {
      request.input('level', sql.NVarChar(50), level);
      query += ' AND level = @level';
    }
    if (semester) {
      request.input('semester', sql.NVarChar(50), semester);
      query += ' AND semester = @semester';
    }
    if (subject) {
      request.input('subject', sql.NVarChar(50), subject);
      query += ' AND subject = @subject';
    }
    if (category) {
      request.input('category', sql.NVarChar(50), category);
      query += ' AND category = @category';
    }

    query += ' ORDER BY created_at DESC';

    const result = await request.query(query);

    res.status(200).json(<ApiResponse<any>>{
      success: true,
      message: 'Resources retrieved successfully.',
      data: result.recordset
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// DELETE /api/resources/:id
// ----------------------------------------------------------
export const deleteResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const pool = await getPool();
    // Get file path first to delete the physical file
    const fileResult = await pool.request()
      .input('id', sql.Int, parseInt(id, 10))
      .query('SELECT file_path FROM resources WHERE id = @id');

    if (fileResult.recordset.length === 0) {
      res.status(404).json(<ApiResponse>{
        success: false,
        message: 'Resource not found.'
      });
      return;
    }

    const relativePath = fileResult.recordset[0].file_path;
    const absolutePath = path.join(__dirname, '../../../', relativePath);

    // Delete record from database
    await pool.request()
      .input('id', sql.Int, parseInt(id, 10))
      .query('DELETE FROM resources WHERE id = @id');

    // Delete file from disk
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (fileErr) {
        console.error('Error deleting file from disk:', fileErr);
      }
    }

    res.status(200).json(<ApiResponse>{
      success: true,
      message: 'Resource deleted successfully.'
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// PATCH /api/resources/:id/rename
// ----------------------------------------------------------
export const renameResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json(<ApiResponse>{
        success: false,
        message: 'New name is required.',
      });
      return;
    }

    const trimmedName = name.trim();

    const pool = await getPool();

    // Verify resource exists
    const existing = await pool.request()
      .input('id', sql.Int, parseInt(id, 10))
      .query('SELECT id FROM resources WHERE id = @id');

    if (existing.recordset.length === 0) {
      res.status(404).json(<ApiResponse>{
        success: false,
        message: 'Resource not found.',
      });
      return;
    }

    // Update original_name and title
    await pool.request()
      .input('id', sql.Int, parseInt(id, 10))
      .input('name', sql.NVarChar(255), trimmedName)
      .query('UPDATE resources SET original_name = @name, title = @name WHERE id = @id');

    res.status(200).json(<ApiResponse>{
      success: true,
      message: 'Resource renamed successfully.',
    });
  } catch (error) {
    console.error('Rename resource error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// GET /api/resources/stats
// Returns dashboard statistics for the admin panel
// ----------------------------------------------------------
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = await getPool();

    // Total students (role = 'student')
    const studentsResult = await pool.request()
      .query("SELECT COUNT(*) AS total FROM users WHERE role = 'student'");
    const totalStudents: number = studentsResult.recordset[0].total;

    // Total resources
    const resourcesResult = await pool.request()
      .query('SELECT COUNT(*) AS total FROM resources');
    const totalResources: number = resourcesResult.recordset[0].total;

    // Active quizzes (category = 'quizzes')
    const quizzesResult = await pool.request()
      .query("SELECT COUNT(*) AS total FROM resources WHERE category = 'quizzes'");
    const activeQuizzes: number = quizzesResult.recordset[0].total;

    // Category breakdown for pie chart
    const breakdownResult = await pool.request()
      .query(`
        SELECT category, COUNT(*) AS count
        FROM resources
        GROUP BY category
      `);

    const categoryBreakdown: Record<string, number> = {};
    for (const row of breakdownResult.recordset) {
      categoryBreakdown[row.category] = row.count;
    }

    res.status(200).json(<ApiResponse<any>>{
      success: true,
      message: 'Dashboard stats retrieved successfully.',
      data: {
        totalStudents,
        totalResources,
        activeQuizzes,
        categoryBreakdown,
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ============================================================
// src/controllers/quiz.controller.ts
// Controller for quiz CRUD, MCQ submission, document submission
// ============================================================

import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sql, getPool } from '../config/database';
import { ApiResponse, CreateQuizRequest, SubmitMcqRequest } from '../types';
import { AuthRequest } from '../middleware/auth.middleware';

// ----------------------------------------------------------
// Multer config for quiz document uploads
// ----------------------------------------------------------
const quizUploadDir = path.join(__dirname, '../../../uploads/quiz-docs');
if (!fs.existsSync(quizUploadDir)) {
  fs.mkdirSync(quizUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, quizUploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'quiz-doc-' + uniqueSuffix + ext);
  }
});

export const quizUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

// ----------------------------------------------------------
// POST /api/quizzes — Create a quiz (admin only)
// ----------------------------------------------------------
export const createQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, type, level, semester, edu_stream, time_limit, questions }: CreateQuizRequest = req.body;
    const userId = req.user!.userId;

    if (!title || !type || !level || !semester || !edu_stream) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Missing required fields: title, type, level, semester, edu_stream.' });
      return;
    }

    if (type !== 'mcq' && type !== 'document') {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Type must be "mcq" or "document".' });
      return;
    }

    // MCQ must have exactly 10 questions with correct answers
    if (type === 'mcq') {
      if (!questions || questions.length !== 10) {
        res.status(400).json(<ApiResponse>{ success: false, message: 'MCQ quiz must have exactly 10 questions.' });
        return;
      }
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct_option) {
          res.status(400).json(<ApiResponse>{ success: false, message: `Question ${i + 1} is incomplete.` });
          return;
        }
        if (!['A', 'B', 'C', 'D'].includes(q.correct_option)) {
          res.status(400).json(<ApiResponse>{ success: false, message: `Question ${i + 1} has invalid correct_option.` });
          return;
        }
      }
    }

    const pool = await getPool();
    const timeLimitVal = time_limit && time_limit > 0 ? time_limit : 10;

    // Insert quiz
    const quizResult = await pool.request()
      .input('title', sql.NVarChar(255), title)
      .input('type', sql.NVarChar(10), type)
      .input('level', sql.NVarChar(50), level)
      .input('semester', sql.NVarChar(50), semester)
      .input('edu_stream', sql.NVarChar(50), edu_stream)
      .input('time_limit', sql.Int, timeLimitVal)
      .input('created_by', sql.Int, userId)
      .query(`
        INSERT INTO quizzes (title, type, level, semester, edu_stream, time_limit, created_by)
        OUTPUT INSERTED.id
        VALUES (@title, @type, @level, @semester, @edu_stream, @time_limit, @created_by)
      `);

    const quizId = quizResult.recordset[0].id;

    // Insert questions for MCQ
    if (type === 'mcq' && questions) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await pool.request()
          .input('quiz_id', sql.Int, quizId)
          .input('question_num', sql.Int, i + 1)
          .input('question_text', sql.NVarChar(sql.MAX), q.question_text)
          .input('option_a', sql.NVarChar(500), q.option_a)
          .input('option_b', sql.NVarChar(500), q.option_b)
          .input('option_c', sql.NVarChar(500), q.option_c)
          .input('option_d', sql.NVarChar(500), q.option_d)
          .input('correct_option', sql.NVarChar(1), q.correct_option)
          .query(`
            INSERT INTO quiz_questions (quiz_id, question_num, question_text, option_a, option_b, option_c, option_d, correct_option)
            VALUES (@quiz_id, @question_num, @question_text, @option_a, @option_b, @option_c, @option_d, @correct_option)
          `);
      }
    }

    res.status(201).json(<ApiResponse<any>>{
      success: true,
      message: 'Quiz created successfully.',
      data: { id: quizId }
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// GET /api/quizzes — List quizzes (filtered)
// Admin sees all; students can filter by level/semester/edu_stream
// ----------------------------------------------------------
export const getQuizzes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { level, semester, edu_stream } = req.query;
    const pool = await getPool();

    let query = 'SELECT q.*, u.full_name AS creator_name FROM quizzes q LEFT JOIN users u ON q.created_by = u.id WHERE 1=1';
    const request = pool.request();

    if (level) {
      request.input('level', sql.NVarChar(50), level);
      query += ' AND q.level = @level';
    }
    if (semester) {
      request.input('semester', sql.NVarChar(50), semester);
      query += ' AND q.semester = @semester';
    }
    if (edu_stream) {
      request.input('edu_stream', sql.NVarChar(50), edu_stream);
      query += ' AND q.edu_stream = @edu_stream';
    }

    query += ' ORDER BY q.created_at DESC';

    const result = await request.query(query);

    // If student, also check which ones they already submitted
    if (req.user!.role === 'student') {
      const subResult = await pool.request()
        .input('student_id', sql.Int, req.user!.userId)
        .query('SELECT quiz_id FROM quiz_submissions WHERE student_id = @student_id');

      const submittedQuizIds = new Set(subResult.recordset.map((r: any) => r.quiz_id));

      const quizzesWithStatus = result.recordset.map((q: any) => ({
        ...q,
        submitted: submittedQuizIds.has(q.id)
      }));

      res.status(200).json(<ApiResponse<any>>{ success: true, message: 'Quizzes retrieved.', data: quizzesWithStatus });
      return;
    }

    res.status(200).json(<ApiResponse<any>>{ success: true, message: 'Quizzes retrieved.', data: result.recordset });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// GET /api/quizzes/:id — Get single quiz with questions
// ----------------------------------------------------------
export const getQuizById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const quizResult = await pool.request()
      .input('id', sql.Int, parseInt(id, 10))
      .query('SELECT * FROM quizzes WHERE id = @id');

    if (quizResult.recordset.length === 0) {
      res.status(404).json(<ApiResponse>{ success: false, message: 'Quiz not found.' });
      return;
    }

    const quiz = quizResult.recordset[0];

    // For MCQ, fetch questions
    let questions: any[] = [];
    if (quiz.type === 'mcq') {
      const qResult = await pool.request()
        .input('quiz_id', sql.Int, quiz.id)
        .query('SELECT * FROM quiz_questions WHERE quiz_id = @quiz_id ORDER BY question_num');

      questions = qResult.recordset;

      // If student, hide correct_option (they shouldn't see it before submitting)
      if (req.user!.role === 'student') {
        // Check if they already submitted
        const subCheck = await pool.request()
          .input('quiz_id', sql.Int, quiz.id)
          .input('student_id', sql.Int, req.user!.userId)
          .query('SELECT * FROM quiz_submissions WHERE quiz_id = @quiz_id AND student_id = @student_id');

        if (subCheck.recordset.length === 0) {
          // Haven't submitted yet — hide correct answers
          questions = questions.map((q: any) => {
            const { correct_option, ...rest } = q;
            return rest;
          });
        }
        // If already submitted, include correct_option so they can see results
      }
    }

    // Check if current student already submitted
    let submission = null;
    if (req.user!.role === 'student') {
      const subResult = await pool.request()
        .input('quiz_id', sql.Int, quiz.id)
        .input('student_id', sql.Int, req.user!.userId)
        .query('SELECT * FROM quiz_submissions WHERE quiz_id = @quiz_id AND student_id = @student_id');

      if (subResult.recordset.length > 0) {
        submission = subResult.recordset[0];
      }
    }

    res.status(200).json(<ApiResponse<any>>{
      success: true,
      message: 'Quiz retrieved.',
      data: { ...quiz, questions, submission }
    });
  } catch (error) {
    console.error('Get quiz by ID error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// DELETE /api/quizzes/:id — Delete a quiz (admin only)
// Cascade deletes questions + submissions
// ----------------------------------------------------------
export const deleteQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Check quiz exists and get any document submissions to clean up files
    const quizResult = await pool.request()
      .input('id', sql.Int, parseInt(id, 10))
      .query('SELECT * FROM quizzes WHERE id = @id');

    if (quizResult.recordset.length === 0) {
      res.status(404).json(<ApiResponse>{ success: false, message: 'Quiz not found.' });
      return;
    }

    // Delete document submission files from disk
    if (quizResult.recordset[0].type === 'document') {
      const subs = await pool.request()
        .input('quiz_id', sql.Int, parseInt(id, 10))
        .query('SELECT file_path FROM quiz_submissions WHERE quiz_id = @quiz_id AND file_path IS NOT NULL');

      for (const sub of subs.recordset) {
        const absPath = path.join(__dirname, '../../../', sub.file_path);
        if (fs.existsSync(absPath)) {
          try { fs.unlinkSync(absPath); } catch (e) { console.error('Error deleting quiz doc:', e); }
        }
      }
    }

    // Cascade delete handles questions + submissions
    await pool.request()
      .input('id', sql.Int, parseInt(id, 10))
      .query('DELETE FROM quizzes WHERE id = @id');

    res.status(200).json(<ApiResponse>{ success: true, message: 'Quiz deleted successfully.' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// POST /api/quizzes/:id/submit-mcq — Submit MCQ answers
// Auto-grades against correct_option
// ----------------------------------------------------------
export const submitMcqAnswers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { answers }: SubmitMcqRequest = req.body;
    const studentId = req.user!.userId;

    if (!answers || typeof answers !== 'object') {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Answers object is required.' });
      return;
    }

    const pool = await getPool();

    // Verify quiz exists and is MCQ
    const quizResult = await pool.request()
      .input('id', sql.Int, parseInt(id, 10))
      .query('SELECT * FROM quizzes WHERE id = @id');

    if (quizResult.recordset.length === 0) {
      res.status(404).json(<ApiResponse>{ success: false, message: 'Quiz not found.' });
      return;
    }
    if (quizResult.recordset[0].type !== 'mcq') {
      res.status(400).json(<ApiResponse>{ success: false, message: 'This is not an MCQ quiz.' });
      return;
    }

    // Check if already submitted
    const existing = await pool.request()
      .input('quiz_id', sql.Int, parseInt(id, 10))
      .input('student_id', sql.Int, studentId)
      .query('SELECT id FROM quiz_submissions WHERE quiz_id = @quiz_id AND student_id = @student_id');

    if (existing.recordset.length > 0) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'You have already submitted this quiz.' });
      return;
    }

    // Validate all 10 questions answered
    const answerKeys = Object.keys(answers);
    if (answerKeys.length !== 10) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'All 10 questions must be answered.' });
      return;
    }

    // Get correct answers for grading
    const questionsResult = await pool.request()
      .input('quiz_id', sql.Int, parseInt(id, 10))
      .query('SELECT question_num, correct_option FROM quiz_questions WHERE quiz_id = @quiz_id ORDER BY question_num');

    let score = 0;
    const total = questionsResult.recordset.length;

    for (const q of questionsResult.recordset) {
      const studentAnswer = answers[String(q.question_num)];
      if (studentAnswer && studentAnswer.toUpperCase() === q.correct_option) {
        score++;
      }
    }

    // Save submission
    await pool.request()
      .input('quiz_id', sql.Int, parseInt(id, 10))
      .input('student_id', sql.Int, studentId)
      .input('answers_json', sql.NVarChar(sql.MAX), JSON.stringify(answers))
      .input('score', sql.Int, score)
      .input('total', sql.Int, total)
      .query(`
        INSERT INTO quiz_submissions (quiz_id, student_id, answers_json, score, total)
        VALUES (@quiz_id, @student_id, @answers_json, @score, @total)
      `);

    res.status(201).json(<ApiResponse<any>>{
      success: true,
      message: 'Quiz submitted successfully.',
      data: { score, total }
    });
  } catch (error) {
    console.error('Submit MCQ error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// POST /api/quizzes/:id/submit-document — Upload document submission
// ----------------------------------------------------------
export const submitDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const studentId = req.user!.userId;
    const file = req.file;

    if (!file) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'No file uploaded.' });
      return;
    }

    const pool = await getPool();

    // Verify quiz exists and is document type
    const quizResult = await pool.request()
      .input('id', sql.Int, parseInt(id, 10))
      .query('SELECT * FROM quizzes WHERE id = @id');

    if (quizResult.recordset.length === 0) {
      // Clean up uploaded file
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(404).json(<ApiResponse>{ success: false, message: 'Quiz not found.' });
      return;
    }
    if (quizResult.recordset[0].type !== 'document') {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(400).json(<ApiResponse>{ success: false, message: 'This is not a document quiz.' });
      return;
    }

    // Check if already submitted
    const existing = await pool.request()
      .input('quiz_id', sql.Int, parseInt(id, 10))
      .input('student_id', sql.Int, studentId)
      .query('SELECT id FROM quiz_submissions WHERE quiz_id = @quiz_id AND student_id = @student_id');

    if (existing.recordset.length > 0) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(400).json(<ApiResponse>{ success: false, message: 'You have already submitted this quiz.' });
      return;
    }

    const relativePath = `uploads/quiz-docs/${file.filename}`;

    await pool.request()
      .input('quiz_id', sql.Int, parseInt(id, 10))
      .input('student_id', sql.Int, studentId)
      .input('file_path', sql.NVarChar(500), relativePath)
      .input('original_name', sql.NVarChar(255), file.originalname)
      .query(`
        INSERT INTO quiz_submissions (quiz_id, student_id, file_path, original_name)
        VALUES (@quiz_id, @student_id, @file_path, @original_name)
      `);

    res.status(201).json(<ApiResponse<any>>{
      success: true,
      message: 'Document submitted successfully.',
      data: { file_path: relativePath, original_name: file.originalname }
    });
  } catch (error) {
    console.error('Submit document error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// GET /api/quizzes/:id/submissions — Admin: list all submissions
// ----------------------------------------------------------
export const getSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Get quiz info
    const quizResult = await pool.request()
      .input('id', sql.Int, parseInt(id, 10))
      .query('SELECT * FROM quizzes WHERE id = @id');

    if (quizResult.recordset.length === 0) {
      res.status(404).json(<ApiResponse>{ success: false, message: 'Quiz not found.' });
      return;
    }

    const quiz = quizResult.recordset[0];

    // Get submissions with student details
    const subsResult = await pool.request()
      .input('quiz_id', sql.Int, parseInt(id, 10))
      .query(`
        SELECT s.*, u.full_name AS student_name, u.student_id AS student_reg_id, u.email AS student_email
        FROM quiz_submissions s
        LEFT JOIN users u ON s.student_id = u.id
        WHERE s.quiz_id = @quiz_id
        ORDER BY s.submitted_at DESC
      `);

    // For MCQ quizzes, also fetch questions so admin can see correct answers
    let questions: any[] = [];
    if (quiz.type === 'mcq') {
      const qResult = await pool.request()
        .input('quiz_id', sql.Int, parseInt(id, 10))
        .query('SELECT * FROM quiz_questions WHERE quiz_id = @quiz_id ORDER BY question_num');
      questions = qResult.recordset;
    }

    res.status(200).json(<ApiResponse<any>>{
      success: true,
      message: 'Submissions retrieved.',
      data: { quiz, submissions: subsResult.recordset, questions }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// GET /api/quizzes/submissions/:submissionId/download — Download doc
// ----------------------------------------------------------
export const downloadSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const pool = await getPool();

    const subResult = await pool.request()
      .input('id', sql.Int, parseInt(submissionId, 10))
      .query('SELECT * FROM quiz_submissions WHERE id = @id');

    if (subResult.recordset.length === 0) {
      res.status(404).json(<ApiResponse>{ success: false, message: 'Submission not found.' });
      return;
    }

    const submission = subResult.recordset[0];

    if (!submission.file_path) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'This submission has no file.' });
      return;
    }

    const absPath = path.join(__dirname, '../../../', submission.file_path);

    if (!fs.existsSync(absPath)) {
      res.status(404).json(<ApiResponse>{ success: false, message: 'File not found on disk.' });
      return;
    }

    res.download(absPath, submission.original_name || 'download');
  } catch (error) {
    console.error('Download submission error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

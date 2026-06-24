// ============================================================
// src/routes/quiz.routes.ts
// Routes for quiz operations
// ============================================================

import { Router } from 'express';
import {
  createQuiz,
  getQuizzes,
  getQuizById,
  deleteQuiz,
  submitMcqAnswers,
  submitDocument,
  getSubmissions,
  downloadSubmission,
  quizUpload
} from '../controllers/quiz.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All quiz routes require authentication
router.use(verifyToken);

// Admin: download a submission document (must be before /:id to avoid conflict)
router.get('/submissions/:submissionId/download', requireRole('admin'), downloadSubmission);

// Admin: create a quiz
router.post('/', requireRole('admin'), createQuiz);

// List quizzes (admin sees all, student sees filtered)
router.get('/', getQuizzes);

// Get single quiz with questions
router.get('/:id', getQuizById);

// Admin: delete a quiz
router.delete('/:id', requireRole('admin'), deleteQuiz);

// Student: submit MCQ answers
router.post('/:id/submit-mcq', submitMcqAnswers);

// Student: submit document
router.post('/:id/submit-document', quizUpload.single('file'), submitDocument);

// Admin: get submissions for a quiz
router.get('/:id/submissions', requireRole('admin'), getSubmissions);

export default router;

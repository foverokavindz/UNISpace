// ============================================================
// src/pages/AdminCreateQuizPage.tsx
// Admin form to create MCQ or Document quiz
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { DUMMY_QUIZZES } from '../_mock/dummyQuizzes';
import type { QuestionInput } from '../_mock/dummyQuizzes';

const LEVELS = ['1', '2', '3', '4'];
const SEMESTERS = ['semester-1', 'semester-2'];
const EDU_STREAMS = ['IMGT', 'CMIS', 'ELTN', 'MATHS_STAT'];

const emptyQuestion = (): QuestionInput => ({
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: '',
});

const AdminCreateQuizPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'mcq' | 'document'>('mcq');
  const [level, setLevel] = useState('');
  const [semester, setSemester] = useState('');
  const [eduStream, setEduStream] = useState('');
  const [timeLimit, setTimeLimit] = useState(10);
  const [questions, setQuestions] = useState<QuestionInput[]>(
    Array.from({ length: 10 }, () => emptyQuestion())
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ----------------------------------------------------------
  // Load a dummy quiz set into all form fields
  // ----------------------------------------------------------
  const handleLoadDummy = (index: string) => {
    if (!index) return;
    const dummy = DUMMY_QUIZZES[parseInt(index)];
    if (!dummy) return;

    setTitle(dummy.title);
    setType('mcq');
    setLevel(dummy.level);
    setSemester(dummy.semester);
    setEduStream(dummy.eduStream);
    setTimeLimit(dummy.timeLimit);
    setQuestions([...dummy.questions]);
    setErrorMsg(null);
  };

  const updateQuestion = (index: number, field: keyof QuestionInput, value: string) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !level || !semester || !eduStream) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (type === 'mcq') {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question_text.trim() || !q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
          setErrorMsg(`Question ${i + 1} is incomplete. Fill all fields.`);
          return;
        }
        if (!q.correct_option) {
          setErrorMsg(`Question ${i + 1}: Please select the correct answer.`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        type,
        level,
        semester,
        edu_stream: eduStream,
        time_limit: timeLimit,
      };
      if (type === 'mcq') {
        payload.questions = questions;
      }

      const response = await api.post('/quizzes', payload);
      if (response.data?.success) {
        alert('Quiz created successfully!');
        navigate('/admin/quizzes');
      } else {
        setErrorMsg(response.data?.message || 'Failed to create quiz.');
      }
    } catch (err: any) {
      console.error('Create quiz error:', err);
      setErrorMsg(err.response?.data?.message || 'Error creating quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 bg-gray-50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Create Quiz 📝</h1>
              <p className="text-gray-500 mt-1">Create a new MCQ or document upload quiz.</p>
            </div>
            <button
              onClick={() => navigate('/admin/quizzes')}
              className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition"
            >
              &larr; Back to Quizzes
            </button>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 border border-gray-100 space-y-6">
            {/* ── Dummy Data Loader ── */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-4">
              <span className="text-amber-600 text-lg">⚡</span>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-amber-800 mb-1">Quick Fill — Load Dummy Quiz Data</label>
                <select
                  defaultValue=""
                  onChange={(e) => handleLoadDummy(e.target.value)}
                  className="w-full md:w-96 border border-amber-300 bg-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer"
                >
                  <option value="">— Select a pre-built quiz to auto-fill —</option>
                  {DUMMY_QUIZZES.map((dq, i) => (
                    <option key={i} value={String(i)}>{dq.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm">
                {errorMsg}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="e.g., Data Structures Mid-Term Quiz"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'mcq' | 'document')}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                >
                  <option value="mcq">MCQ (Multiple Choice)</option>
                  <option value="document">Document Upload</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                >
                  <option value="">Select Level</option>
                  {LEVELS.map(l => <option key={l} value={l}>Level {l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                >
                  <option value="">Select Semester</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>{s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education Stream *</label>
                <select
                  value={eduStream}
                  onChange={(e) => setEduStream(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                >
                  <option value="">Select Stream</option>
                  {EDU_STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (mins)</label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value) || 10)}
                  min={1}
                  max={180}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>
            </div>

            {/* MCQ Questions */}
            {type === 'mcq' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Questions (10 required)</h2>
                {questions.map((q, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-700 mb-3">Question {idx + 1}</h3>
                    <textarea
                      value={q.question_text}
                      onChange={(e) => updateQuestion(idx, 'question_text', e.target.value)}
                      placeholder="Enter the question..."
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none mb-3"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(['A', 'B', 'C', 'D'] as const).map(opt => (
                        <div key={opt} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${idx}`}
                            checked={q.correct_option === opt}
                            onChange={() => updateQuestion(idx, 'correct_option', opt)}
                            className="accent-green-600"
                            title={`Mark ${opt} as correct`}
                          />
                          <span className="font-medium text-sm text-gray-600 w-4">{opt}.</span>
                          <input
                            type="text"
                            value={q[`option_${opt.toLowerCase()}` as keyof QuestionInput]}
                            onChange={(e) => updateQuestion(idx, `option_${opt.toLowerCase()}` as keyof QuestionInput, e.target.value)}
                            placeholder={`Option ${opt}`}
                            className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    {q.correct_option && (
                      <p className="text-xs text-green-600 mt-2">✓ Correct answer: {q.correct_option}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {type === 'document' && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600">
                  Students will upload a document as their quiz submission. No questions needed. 
                  You can download submitted documents from the submissions page.
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-8 py-2.5 rounded-xl hover:bg-blue-700 transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Quiz'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AdminCreateQuizPage;

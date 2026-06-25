// ============================================================
// src/pages/AdminCreateQuizPage.tsx
// Admin form to create MCQ or Document quiz
// ============================================================

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import Layout from '../components/Layout';
import { FileText, Check, Plus, Trash2, Upload, Info } from 'lucide-react';
import api from '../services/api';
import type { QuestionInput } from '../types';

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
  const [questions, setQuestions] = useState<QuestionInput[]>([emptyQuestion()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const updateQuestion = (index: number, field: keyof QuestionInput, value: string) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addQuestion = () => setQuestions(prev => [...prev, emptyQuestion()]);

  const removeQuestion = (index: number) => {
    setQuestions(prev => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  // ----------------------------------------------------------
  // Import questions from a CSV file (replaces current blocks)
  // Expected columns: question_text, option_a, option_b,
  //                   option_c, option_d, correct_option (A/B/C/D)
  // ----------------------------------------------------------
  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // reset input so re-importing the same file fires onChange again
        if (csvInputRef.current) csvInputRef.current.value = '';

        const rows = results.data || [];
        if (rows.length === 0) {
          setErrorMsg('The CSV file has no question rows.');
          return;
        }

        const parsed: QuestionInput[] = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const correct = (row.correct_option || '').trim().toUpperCase();
          if (!['A', 'B', 'C', 'D'].includes(correct)) {
            setErrorMsg(`Row ${i + 1}: correct_option must be A, B, C, or D (got "${row.correct_option ?? ''}").`);
            return;
          }
          parsed.push({
            question_text: (row.question_text || '').trim(),
            option_a: (row.option_a || '').trim(),
            option_b: (row.option_b || '').trim(),
            option_c: (row.option_c || '').trim(),
            option_d: (row.option_d || '').trim(),
            correct_option: correct,
          });
        }

        setQuestions(parsed);
        setType('mcq');
        setErrorMsg(null);
      },
      error: (err) => {
        setErrorMsg(`Failed to parse CSV: ${err.message}`);
      },
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
      if (questions.length < 1) {
        setErrorMsg('Add at least one question.');
        return;
      }
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
    <Layout>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">Create Quiz <FileText size={26} /></h1>
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
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2">
                  <h2 className="text-lg font-semibold text-gray-800">Questions ({questions.length})</h2>
                  {/* CSV import button with hover helper */}
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => csvInputRef.current?.click()}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-semibold text-sm"
                    >
                      <Upload size={16} /> Import CSV
                      <Info size={14} className="opacity-80" />
                    </button>
                    <input
                      ref={csvInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleCsvImport}
                      className="hidden"
                    />
                    {/* Tooltip */}
                    <div className="absolute right-0 z-10 mt-2 w-80 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg">
                      <p className="font-semibold mb-1">CSV format (one row per question)</p>
                      <p className="text-gray-300 mb-2">Header row required, columns in this order:</p>
                      <code className="block bg-gray-800 rounded p-2 mb-2 break-words">
                        question_text,option_a,option_b,option_c,option_d,correct_option
                      </code>
                      <p className="text-gray-300 mb-1">Example:</p>
                      <code className="block bg-gray-800 rounded p-2 break-words">
                        What is 2 + 2?,3,4,5,6,B
                      </code>
                      <p className="text-gray-400 mt-2">correct_option must be A, B, C, or D. Importing replaces current questions.</p>
                    </div>
                  </div>
                </div>
                {questions.map((q, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-700">Question {idx + 1}</h3>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(idx)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-800 text-xs font-semibold transition"
                          title="Remove this question"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      )}
                    </div>
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
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><Check size={14} /> Correct answer: {q.correct_option}</p>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-blue-300 text-blue-600 rounded-lg py-3 hover:border-blue-400 hover:bg-blue-50 transition font-semibold text-sm"
                >
                  <Plus size={18} /> Add Question
                </button>
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
        </Layout>
  );
};

export default AdminCreateQuizPage;

// ============================================================
// src/pages/AdminQuizSubmissionsPage.tsx
// Admin views all submissions for a specific quiz
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardList, CheckCircle2, XCircle } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../services/api';
import type { Quiz, QuizQuestion, QuizSubmission } from '../types';

const AdminQuizSubmissionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/quizzes/${id}/submissions`);
      if (response.data?.success) {
        setQuiz(response.data.data.quiz);
        setSubmissions(response.data.data.submissions || []);
        setQuestions(response.data.data.questions || []);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setErrorMsg('Failed to load submissions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [id]);

  const handleDownload = (submissionId: number) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('token');
    // Open download in a new tab with auth
    window.open(`${API_BASE_URL}/quizzes/submissions/${submissionId}/download?token=${token}`, '_blank');
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const serverRoot = API_BASE_URL.replace('/api', '');

  return (
    <Layout>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                Submissions {quiz ? `— ${quiz.title}` : ''} <ClipboardList size={26} />
              </h1>
              {quiz && (
                <p className="text-gray-500 mt-1">
                  {quiz.type === 'mcq' ? 'MCQ' : 'Document'} quiz • Level {quiz.level} • {quiz.edu_stream} • {submissions.length} submission(s)
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/admin/quizzes')}
              className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition"
            >
              &larr; Back to Quizzes
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm mb-4">
                {errorMsg}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                    <th className="p-4 font-bold">Student Name</th>
                    <th className="p-4 font-bold">Student ID</th>
                    <th className="p-4 font-bold">Email</th>
                    {quiz?.type === 'mcq' && <th className="p-4 font-bold">Score</th>}
                    {quiz?.type === 'document' && <th className="p-4 font-bold">File</th>}
                    <th className="p-4 font-bold">Submitted</th>
                    {quiz?.type === 'mcq' && <th className="p-4 font-bold text-right">Details</th>}
                    {quiz?.type === 'document' && <th className="p-4 font-bold text-right">Download</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Loading submissions...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!isLoading && submissions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-400 font-medium">
                        No submissions yet.
                      </td>
                    </tr>
                  )}
                  {!isLoading && submissions.map((sub) => (
                    <React.Fragment key={sub.id}>
                      <tr className="hover:bg-gray-50/50 transition">
                        <td className="p-4 font-semibold text-gray-800">{sub.student_name || 'N/A'}</td>
                        <td className="p-4 text-gray-500">{sub.student_reg_id || 'N/A'}</td>
                        <td className="p-4 text-gray-500">{sub.student_email || 'N/A'}</td>
                        {quiz?.type === 'mcq' && (
                          <td className="p-4">
                            <span className={`font-semibold ${
                              sub.score !== null && sub.total !== null && sub.score >= sub.total / 2
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {sub.score ?? 0}/{sub.total ?? 0}
                            </span>
                          </td>
                        )}
                        {quiz?.type === 'document' && (
                          <td className="p-4 text-gray-500 text-xs">{sub.original_name || 'No file'}</td>
                        )}
                        <td className="p-4 text-gray-400 text-xs">
                          {new Date(sub.submitted_at).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        {quiz?.type === 'mcq' && (
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                              className="text-blue-600 hover:text-blue-800 font-semibold text-xs border border-blue-200 hover:border-blue-400 bg-blue-50/50 rounded-lg px-3 py-1.5 transition"
                            >
                              {expandedId === sub.id ? 'Hide' : 'View Answers'}
                            </button>
                          </td>
                        )}
                        {quiz?.type === 'document' && (
                          <td className="p-4 text-right">
                            {sub.file_path ? (
                              <a
                                href={`${serverRoot}/${sub.file_path}`}
                                download={sub.original_name || 'download'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-semibold text-xs border border-blue-200 hover:border-blue-400 bg-blue-50/50 rounded-lg px-3 py-1.5 transition"
                              >
                                Download
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">No file</span>
                            )}
                          </td>
                        )}
                      </tr>
                      {/* Expanded MCQ answers */}
                      {quiz?.type === 'mcq' && expandedId === sub.id && sub.answers_json && (
                        <tr>
                          <td colSpan={7} className="p-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {questions.map((q) => {
                                const answers: Record<string, string> = JSON.parse(sub.answers_json!);
                                const studentAnswer = answers[String(q.question_num)] || '—';
                                const isCorrect = studentAnswer.toUpperCase() === q.correct_option;
                                return (
                                  <div key={q.id} className={`p-3 rounded-lg border text-sm ${
                                    isCorrect
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-red-50 border-red-200'
                                  }`}>
                                    <p className="font-medium text-gray-800">Q{q.question_num}: {q.question_text}</p>
                                    <p className="mt-1">
                                      Student: <span className="font-semibold">{studentAnswer}</span>
                                      {' '} | Correct: <span className="font-semibold text-green-700">{q.correct_option}</span>
                                      {' '}
                                      {isCorrect
                                        ? <CheckCircle2 size={16} className="inline text-green-600" />
                                        : <XCircle size={16} className="inline text-red-600" />}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Layout>
  );
};

export default AdminQuizSubmissionsPage;

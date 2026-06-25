// ============================================================
// src/pages/AdminQuizListPage.tsx
// Admin view: list all quizzes, delete, view submissions
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { FileText, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';
import type { Quiz } from '../types';

const AdminQuizListPage: React.FC = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/quizzes');
      if (response.data?.success) {
        setQuizzes(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setErrorMsg('Failed to load quizzes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this quiz? All submissions will be lost.')) return;
    try {
      const response = await api.delete(`/quizzes/${id}`);
      if (response.data?.success) {
        setQuizzes(prev => prev.filter(q => q.id !== id));
      } else {
        alert('Failed to delete quiz.');
      }
    } catch (err) {
      console.error('Delete quiz error:', err);
      alert('Error deleting quiz.');
    }
  };

  const formatSemester = (sem: string) => {
    return sem.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Layout>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">Quizzes <FileText size={26} /></h1>
              <p className="text-gray-500 mt-1">Manage quizzes and view student submissions.</p>
            </div>
            <button
              onClick={() => navigate('/admin/quizzes/create')}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition font-semibold text-sm flex items-center gap-2 shadow-sm"
            >
              <Plus size={20} /> Create Quiz
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
                    <th className="p-4 font-bold">Title</th>
                    <th className="p-4 font-bold">Type</th>
                    <th className="p-4 font-bold">Level / Semester</th>
                    <th className="p-4 font-bold">Stream</th>
                    <th className="p-4 font-bold">Time Limit</th>
                    <th className="p-4 font-bold">Created</th>
                    <th className="p-4 font-bold text-right">Actions</th>
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
                          <span>Loading quizzes...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!isLoading && quizzes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-400 font-medium">
                        No quizzes yet. Create your first quiz!
                      </td>
                    </tr>
                  )}
                  {!isLoading && quizzes.map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 font-semibold text-gray-800">{quiz.title}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          quiz.type === 'mcq'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {quiz.type === 'mcq' ? 'MCQ' : 'Document'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500">
                        Level {quiz.level} / {formatSemester(quiz.semester)}
                      </td>
                      <td className="p-4 text-gray-500 font-medium">{quiz.edu_stream}</td>
                      <td className="p-4 text-gray-500">{quiz.time_limit} min</td>
                      <td className="p-4 text-gray-400 text-xs">
                        {new Date(quiz.created_at).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </td>
                      <td className="p-4 text-right flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => navigate(`/admin/quizzes/${quiz.id}/submissions`)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-xs border border-blue-200 hover:border-blue-400 bg-blue-50/50 rounded-lg px-3 py-1.5 transition"
                        >
                          Submissions
                        </button>
                        <button
                          onClick={() => handleDelete(quiz.id)}
                          className="text-red-600 hover:text-white border border-red-150 hover:bg-red-600 rounded-lg p-1.5 transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Layout>
  );
};

export default AdminQuizListPage;

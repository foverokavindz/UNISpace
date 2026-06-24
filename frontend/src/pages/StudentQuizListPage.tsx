// ============================================================
// src/pages/StudentQuizListPage.tsx
// Student view: list quizzes assigned to their level/semester/stream
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import type { Quiz } from '../types';

const StudentQuizListPage: React.FC = () => {
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

  const formatSemester = (sem: string) => {
    return sem.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 bg-gray-50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Quizzes 📝</h1>
              <p className="text-gray-500 mt-1">View and take quizzes assigned to you.</p>
            </div>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition"
            >
              &larr; Back to Dashboard
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm mb-4">
              {errorMsg}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}

          {!isLoading && quizzes.length === 0 && (
            <div className="text-center py-16 text-gray-400 font-medium">
              No quizzes available at the moment.
            </div>
          )}

          {!isLoading && quizzes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white rounded-xl shadow border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        quiz.type === 'mcq'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {quiz.type === 'mcq' ? 'MCQ' : 'Document'}
                      </span>
                      {quiz.submitted ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Submitted ✓
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                          Pending
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{quiz.title}</h3>
                    <p className="text-sm text-gray-500 mb-1">
                      Level {quiz.level} • {formatSemester(quiz.semester)} • {quiz.edu_stream}
                    </p>
                    <p className="text-xs text-gray-400">
                      ⏱ {quiz.time_limit} min • Created {new Date(quiz.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
                      disabled={quiz.submitted}
                      className={`w-full py-2 rounded-lg text-sm font-semibold transition ${
                        quiz.submitted
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {quiz.submitted ? 'Already Submitted' : 'Take Quiz →'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentQuizListPage;

// ============================================================
// src/pages/StudentTakeQuizPage.tsx
// Student takes a quiz: MCQ (single page, radio, timer) or Document upload
// Shows results after MCQ submission (green=correct, red=wrong)
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import type { Quiz, QuizQuestion, QuizSubmission } from '../types';

const StudentTakeQuizPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(0); // seconds
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);

  // Document upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // MCQ result state (after submission)
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  const fetchQuiz = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/quizzes/${id}`);
      if (response.data?.success) {
        const data = response.data.data;
        setQuiz(data);
        setQuestions(data.questions || []);
        if (data.submission) {
          setSubmission(data.submission);
          // If MCQ and already submitted, show results
          if (data.type === 'mcq' && data.submission.answers_json) {
            setShowResults(true);
            setScore(data.submission.score);
            setTotal(data.submission.total);
            // Parse stored answers
            setAnswers(JSON.parse(data.submission.answers_json));
          }
        } else {
          // Start timer only if not submitted
          setTimeLeft(data.time_limit * 60);
        }
      }
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setErrorMsg('Failed to load quiz.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !submission && !showResults) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [timeLeft, submission, showResults]);

  // Auto-submit when timer expires (MCQ only)
  useEffect(() => {
    if (timerExpired && quiz?.type === 'mcq' && !submission && !showResults) {
      handleSubmitMcq(true);
    }
  }, [timerExpired]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionNum: number, option: string) => {
    setAnswers(prev => ({ ...prev, [String(questionNum)]: option }));
    setValidationMsg(null);
  };

  const handleSubmitMcq = async (isAutoSubmit = false) => {
    setValidationMsg(null);
    setErrorMsg(null);

    // Validate all 10 answered
    if (!isAutoSubmit) {
      const answeredCount = Object.keys(answers).length;
      if (answeredCount < 10) {
        setValidationMsg(`Please answer all 10 questions. You've answered ${answeredCount}/10.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await api.post(`/quizzes/${id}/submit-mcq`, { answers });
      if (response.data?.success) {
        setScore(response.data.data.score);
        setTotal(response.data.data.total);
        setShowResults(true);
        if (timerRef.current) clearInterval(timerRef.current);

        // Re-fetch quiz to get correct answers for results view
        const quizResponse = await api.get(`/quizzes/${id}`);
        if (quizResponse.data?.success) {
          setQuestions(quizResponse.data.data.questions || []);
          setSubmission(quizResponse.data.data.submission);
        }
      } else {
        setErrorMsg(response.data?.message || 'Failed to submit quiz.');
      }
    } catch (err: any) {
      console.error('Submit MCQ error:', err);
      setErrorMsg(err.response?.data?.message || 'Error submitting quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDocument = async () => {
    if (!selectedFile) {
      setValidationMsg('Please select a file to upload.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post(`/quizzes/${id}/submit-document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.success) {
        alert('Document submitted successfully!');
        navigate('/student/quizzes');
      } else {
        setErrorMsg(response.data?.message || 'Failed to submit document.');
      }
    } catch (err: any) {
      console.error('Submit document error:', err);
      setErrorMsg(err.response?.data?.message || 'Error submitting document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 bg-gray-50 flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </main>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 bg-gray-50">
            <p className="text-red-600">Quiz not found.</p>
          </main>
        </div>
      </div>
    );
  }

  // Already submitted document quiz
  if (quiz.type === 'document' && submission) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 bg-gray-50">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8 border border-gray-100 text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">✅ Already Submitted</h1>
              <p className="text-gray-500 mb-2">You have already submitted your document for this quiz.</p>
              <p className="text-sm text-gray-400">File: {submission.original_name}</p>
              <button
                onClick={() => navigate('/student/quizzes')}
                className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
              >
                Back to Quizzes
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 bg-gray-50">
          {/* Header with timer */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{quiz.title}</h1>
              <p className="text-gray-500 text-sm mt-1">
                {quiz.type === 'mcq' ? 'Multiple Choice Quiz' : 'Document Upload Quiz'} • Level {quiz.level} • {quiz.edu_stream}
              </p>
            </div>
            {!showResults && !submission && (
              <div className={`text-2xl font-mono font-bold px-4 py-2 rounded-lg ${
                timeLeft <= 60 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                ⏱ {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm mb-4">
              {errorMsg}
            </div>
          )}

          {/* MCQ Results View */}
          {quiz.type === 'mcq' && showResults && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow p-6 border border-gray-100 text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Results</h2>
                <p className={`text-4xl font-bold ${
                  score !== null && total !== null && score >= total / 2
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {score}/{total}
                </p>
                <p className="text-gray-500 mt-1">
                  {score !== null && total !== null
                    ? `${Math.round((score / total) * 100)}% correct`
                    : ''}
                </p>
              </div>

              {questions.map((q, idx) => {
                const studentAnswer = answers[String(q.question_num)] || '';
                const isCorrect = studentAnswer.toUpperCase() === (q.correct_option || '').toUpperCase();

                return (
                  <div key={q.id || idx} className={`bg-white rounded-xl shadow p-5 border ${
                    isCorrect ? 'border-green-300' : 'border-red-300'
                  }`}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {q.question_num}
                      </span>
                      <p className="font-medium text-gray-800 flex-1">{q.question_text}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-11">
                      {(['A', 'B', 'C', 'D'] as const).map(opt => {
                        const optionText = q[`option_${opt.toLowerCase()}` as keyof QuizQuestion] as string;
                        const isStudentAnswer = studentAnswer.toUpperCase() === opt;
                        const isCorrectOption = (q.correct_option || '').toUpperCase() === opt;

                        let bg = 'bg-gray-50 border-gray-200';
                        if (isCorrectOption) bg = 'bg-green-50 border-green-300';
                        if (isStudentAnswer && !isCorrect) bg = 'bg-red-50 border-red-300';

                        return (
                          <div key={opt} className={`p-2.5 rounded-lg border text-sm flex items-center gap-2 ${bg}`}>
                            <span className="font-semibold text-gray-600">{opt}.</span>
                            <span>{optionText}</span>
                            {isCorrectOption && <span className="ml-auto text-green-600">✓</span>}
                            {isStudentAnswer && !isCorrect && <span className="ml-auto text-red-600">✗</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="text-center mt-6">
                <button
                  onClick={() => navigate('/student/quizzes')}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                >
                  Back to Quizzes
                </button>
              </div>
            </div>
          )}

          {/* MCQ Quiz Form */}
          {quiz.type === 'mcq' && !showResults && (
            <div className="space-y-4">
              {validationMsg && (
                <div className="p-3 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg text-sm">
                  ⚠️ {validationMsg}
                </div>
              )}

              {questions.map((q, idx) => (
                <div key={q.id || idx} className="bg-white rounded-xl shadow p-5 border border-gray-100">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                      {q.question_num}
                    </span>
                    <p className="font-medium text-gray-800 flex-1">{q.question_text}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-11">
                    {(['A', 'B', 'C', 'D'] as const).map(opt => {
                      const optionText = q[`option_${opt.toLowerCase()}` as keyof QuizQuestion] as string;
                      const isSelected = answers[String(q.question_num)] === opt;

                      return (
                        <label
                          key={opt}
                          className={`p-2.5 rounded-lg border text-sm flex items-center gap-2 cursor-pointer transition ${
                            isSelected
                              ? 'bg-blue-50 border-blue-400'
                              : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${q.question_num}`}
                            value={opt}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(q.question_num, opt)}
                            className="accent-blue-600"
                          />
                          <span className="font-semibold text-gray-600">{opt}.</span>
                          <span>{optionText}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="text-center pt-4">
                <button
                  onClick={() => handleSubmitMcq(false)}
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-10 py-3 rounded-xl hover:bg-blue-700 transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              </div>
            </div>
          )}

          {/* Document Upload Form */}
          {quiz.type === 'document' && !submission && (
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Your Document</h2>
              <p className="text-sm text-gray-500 mb-6">
                Upload your assignment or quiz response as a document file (PDF, DOCX, etc.)
              </p>

              {validationMsg && (
                <div className="p-3 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg text-sm mb-4">
                  ⚠️ {validationMsg}
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  onChange={(e) => {
                    setSelectedFile(e.target.files?.[0] || null);
                    setValidationMsg(null);
                  }}
                  className="mb-4"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.rar"
                />
                {selectedFile && (
                  <p className="text-sm text-green-600 font-medium">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={handleSubmitDocument}
                  disabled={isSubmitting || !selectedFile}
                  className="bg-blue-600 text-white px-10 py-3 rounded-xl hover:bg-blue-700 transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Uploading...' : 'Submit Document'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentTakeQuizPage;

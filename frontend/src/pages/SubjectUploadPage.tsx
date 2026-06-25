import React from 'react';
import { BookOpen, FileText, ScrollText, Folder, Film, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { useNavigate, useParams } from 'react-router-dom';

const SubjectUploadPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { level, semester, subject } = useParams<{ level: string; semester: string; subject: string }>();

  // Determine title based on URL params
  const levelTitle = `Level ${level}`;
  // Format semester string (e.g., "semester-1" -> "Semester 1")
  const semesterTitle = semester ? semester.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Semester';
  // Format subject string
  let subjectTitle = subject ? subject.toUpperCase() : 'Subject';
  if (subject === 'math-stat') {
    subjectTitle = 'MATH & STAT';
  }

  const isAdmin = user?.role === 'admin';
  const routePrefix = isAdmin ? '/admin/upload-resources' : '/student/resources';

  return (
    <Layout mainClassName="flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                {isAdmin ? 'Upload Resources' : 'Resources'} - {subjectTitle} <BookOpen size={26} />
              </h1>
              <p className="text-gray-500 mt-1">
                {isAdmin ? `Add new study materials for ${levelTitle}, ${semesterTitle}, ${subjectTitle}.` : `Browse study materials for ${levelTitle}, ${semesterTitle}, ${subjectTitle}.`}
              </p>
            </div>
            <button
              onClick={() => navigate(`${routePrefix}/${level}/${semester}`)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm transition"
            >
              &larr; Back to {semesterTitle}
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center pb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-4xl">
              <button
                onClick={() => navigate(`${routePrefix}/${level}/${semester}/${subject}/notes`)}
                className="bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold h-48 rounded-xl shadow-lg transition transform hover:scale-105 flex flex-col items-center justify-center gap-4"
              >
                <FileText size={40} />
                Notes
              </button>
              
              <button
                onClick={() => navigate(`${routePrefix}/${level}/${semester}/${subject}/past-papers`)}
                className="bg-red-500 hover:bg-red-600 text-white text-2xl font-bold h-48 rounded-xl shadow-lg transition transform hover:scale-105 flex flex-col items-center justify-center gap-4"
              >
                <ScrollText size={40} />
                Past Papers
              </button>

              <button
                onClick={() => navigate(`${routePrefix}/${level}/${semester}/${subject}/tutes-assignments`)}
                className="bg-green-500 hover:bg-green-600 text-white text-2xl font-bold h-48 rounded-xl shadow-lg transition transform hover:scale-105 flex flex-col items-center justify-center gap-4"
              >
                <Folder size={40} />
                Tutes & Assignments
              </button>

              <button
                onClick={() => navigate(`${routePrefix}/${level}/${semester}/${subject}/videos`)}
                className="bg-purple-500 hover:bg-purple-600 text-white text-2xl font-bold h-48 rounded-xl shadow-lg transition transform hover:scale-105 flex flex-col items-center justify-center gap-4"
              >
                <Film size={40} />
                Videos
              </button>

              <button
                onClick={() => navigate(`${routePrefix}/${level}/${semester}/${subject}/quizzes`)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white text-2xl font-bold h-48 rounded-xl shadow-lg transition transform hover:scale-105 flex flex-col items-center justify-center gap-4 lg:col-start-2"
              >
                <HelpCircle size={40} />
                Quizzes
              </button>
            </div>
          </div>
        </Layout>
  );
};

export default SubjectUploadPage;

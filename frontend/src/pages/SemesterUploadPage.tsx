import React from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { useNavigate, useParams } from 'react-router-dom';

const SemesterUploadPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { level, semester } = useParams<{ level: string; semester: string }>();

  // Determine title based on URL params
  const levelTitle = `Level ${level}`;
  // Format semester string (e.g., "semester-1" -> "Semester 1")
  const semesterTitle = semester ? semester.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Semester';

  const isAdmin = user?.role === 'admin';
  const routePrefix = isAdmin ? '/admin/upload-resources' : '/student/resources';

  return (
    <Layout mainClassName="flex flex-col">
          <div className="flex items-center justify-between mt-8 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {isAdmin ? 'Upload Resources' : 'Resources'} - {levelTitle} ({semesterTitle}) 📚
              </h1>
              <p className="text-gray-500 mt-1">
                {isAdmin ? `Add new study materials for students in ${levelTitle}, ${semesterTitle}.` : `Browse study materials for ${levelTitle}, ${semesterTitle}.`}
              </p>
            </div>
            <button
              onClick={() => navigate(`${routePrefix}/${level}`)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm transition"
            >
              &larr; Back to {levelTitle}
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center pb-12">
            <div className="grid grid-cols-2 gap-8 w-full max-w-2xl">
              <button
                onClick={() => navigate(`${routePrefix}/${level}/${semester}/imgt`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-2xl font-bold h-48 rounded-xl shadow-lg transition transform hover:scale-105 flex items-center justify-center"
              >
                IMGT
              </button>
              
              <button
                onClick={() => navigate(`${routePrefix}/${level}/${semester}/cmis`)}
                className="bg-purple-500 hover:bg-purple-600 text-white text-2xl font-bold h-48 rounded-xl shadow-lg transition transform hover:scale-105 flex items-center justify-center"
              >
                CMIS
              </button>

              <button
                onClick={() => navigate(`${routePrefix}/${level}/${semester}/eltn`)}
                className="bg-teal-500 hover:bg-teal-600 text-white text-2xl font-bold h-48 rounded-xl shadow-lg transition transform hover:scale-105 flex items-center justify-center"
              >
                ELTN
              </button>

              <button
                onClick={() => navigate(`${routePrefix}/${level}/${semester}/math-stat`)}
                className="bg-pink-500 hover:bg-pink-600 text-white text-2xl font-bold h-48 rounded-xl shadow-lg transition transform hover:scale-105 flex items-center justify-center"
              >
                MATH & STAT
              </button>
            </div>
          </div>
        </Layout>
  );
};

export default SemesterUploadPage;

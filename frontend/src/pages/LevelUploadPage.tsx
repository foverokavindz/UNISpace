import React from 'react';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { useNavigate, useParams } from 'react-router-dom';

const LevelUploadPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { level } = useParams<{ level: string }>();

  // Determine title based on URL param
  const levelTitle = `Level ${level}`;

  const isAdmin = user?.role === 'admin';
  const routePrefix = isAdmin ? '/admin/upload-resources' : '/student/resources';

  return (
    <Layout mainClassName="flex flex-col">
          <div className="flex items-center justify-between mt-8 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                {isAdmin ? 'Upload Resources' : 'Resources'} - {levelTitle} <BookOpen size={26} />
              </h1>
              <p className="text-gray-500 mt-1">
                {isAdmin ? `Add new study materials for students in ${levelTitle}.` : `Browse study materials for ${levelTitle}.`}
              </p>
            </div>
            <button
              onClick={() => navigate(routePrefix)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm transition"
            >
              &larr; Back to Levels
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center pb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-2xl">
              <button
                onClick={() => navigate(`${routePrefix}/${level}/semester-1`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-2xl font-bold h-48 rounded-xl shadow-lg transition transform hover:scale-105 flex items-center justify-center"
              >
                Semester 1
              </button>
              
              <button
                onClick={() => navigate(`${routePrefix}/${level}/semester-2`)}
                className="bg-teal-500 hover:bg-teal-600 text-white text-2xl font-bold h-48 rounded-xl shadow-lg transition transform hover:scale-105 flex items-center justify-center"
              >
                Semester 2
              </button>
            </div>
          </div>
        </Layout>
  );
};

export default LevelUploadPage;

import React from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const UploadResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const routePrefix = isAdmin ? '/admin/upload-resources' : '/student/resources';

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top navbar */}
      <Navbar />

      <div className="flex flex-1">
        {/* Left sidebar */}
        <Sidebar />

        {/* Main content area */}
        <main className="flex-1 p-8 bg-gray-50 flex flex-col">
          <div className="flex items-center justify-between mt-8 mb-8">
            <div>
              <h1 className="text-5xl font-bold text-gray-800">
                {isAdmin ? 'Upload Resources' : 'Resources'} 📚
              </h1>
              <p className="text-gray-500 mt-1">
                {isAdmin ? 'Add new study materials for students.' : 'Browse study materials and upload notes.'}
              </p>
            </div>
            <button
              onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/student/dashboard')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm transition"
            >
              &larr; Back to Dashboard
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center pb-12">
            <div className="grid grid-cols-2 gap-8 w-full max-w-2xl">
              <button
                onClick={() => navigate(`${routePrefix}/1`)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold h-48 rounded-xl shadow-lg transition transform hover:scale-105 flex items-center justify-center"
              >
                Level 1
              </button>
              
              <button
                onClick={() => navigate(`${routePrefix}/2`)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white text-2xl font-bold h-48 rounded-xl shadow-lg transition transform hover:scale-105 flex items-center justify-center"
              >
                Level 2
              </button>

              <button
                onClick={() => navigate(`${routePrefix}/3`)}
                className="bg-green-600 hover:bg-green-700 text-white text-2xl font-bold h-48 rounded-xl shadow-lg transition transform hover:scale-105 flex items-center justify-center"
              >
                Level 3
              </button>

              <button
                onClick={() => navigate(`${routePrefix}/4`)}
                className="bg-orange-500 hover:bg-orange-600 text-white text-2xl font-bold h-48 rounded-xl shadow-lg transition transform hover:scale-105 flex items-center justify-center"
              >
                Level 4
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UploadResourcesPage;

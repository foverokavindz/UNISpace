// ============================================================
// src/pages/AdminDashboard.tsx
// Dashboard shown to logged-in admins
// ============================================================

import React from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top navbar */}
      <Navbar />

      <div className="flex flex-1">
        {/* Left sidebar */}
        <Sidebar />

        {/* Main content area */}
        <main className="flex-1 p-8 bg-gray-50">
          {/* Welcome message */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              Admin Dashboard 🛠️
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome, {user?.full_name}. You have full administrative access.
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded shadow p-5 border-l-4 border-blue-500 hover:shadow-lg transition">
              <p className="text-sm text-gray-500 font-medium">Total Students</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">0</p>
            </div>
            <div className="bg-white rounded shadow p-5 border-l-4 border-green-500 hover:shadow-lg transition">
              <p className="text-sm text-gray-500 font-medium">Total Resources</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">0</p>
            </div>
            <div className="bg-white rounded shadow p-5 border-l-4 border-purple-500 hover:shadow-lg transition">
              <p className="text-sm text-gray-500 font-medium">Active Quizzes</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">0</p>
            </div>
            <div className="bg-white rounded shadow p-5 border-l-4 border-yellow-500 hover:shadow-lg transition">
              <p className="text-sm text-gray-500 font-medium">Notifications</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">0</p>
            </div>
          </div>

          {/* Upload Resources placeholder */}
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Upload Resources</h2>
            <p className="text-gray-400 text-sm mb-4">
              Upload notes, past papers, assignments, tutorials or videos for students.
            </p>
            <button
              disabled
              className="bg-blue-700 text-white px-4 py-2 rounded text-sm opacity-50 cursor-not-allowed"
            >
              Upload Resource (Coming Soon)
            </button>
          </div>

          {/* Manage Resources placeholder */}
          <div className="bg-white rounded shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Manage Resources</h2>
            <p className="text-gray-400 text-sm">
              No resources uploaded yet. Use the Upload Resource section to add materials.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

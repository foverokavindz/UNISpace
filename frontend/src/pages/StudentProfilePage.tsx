// ============================================================
// src/pages/StudentProfilePage.tsx
// Student Profile page
// ============================================================

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();
  
  // State for "Complete Profile" form
  const [bio, setBio] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
              <p className="text-gray-500 mt-1">Manage your student account settings and personal information.</p>
            </div>

            {/* Profile Overview Card */}
            <div className="bg-white rounded shadow p-6 mb-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center text-4xl text-blue-600 font-bold border-4 border-white shadow-md">
                  {user?.full_name.charAt(0).toUpperCase()}
                </div>
                <button className="mt-4 text-sm text-blue-600 font-medium hover:underline">
                  Change Avatar
                </button>
              </div>
              
              <div className="flex-1 w-full">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Account Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Full Name</p>
                    <p className="font-medium text-gray-800">{user?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Student ID</p>
                    <p className="font-medium text-gray-800">{user?.student_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Email Address</p>
                    <p className="font-medium text-gray-800">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Mobile Number</p>
                    <p className="font-medium text-gray-800">{user?.mobile_number || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Role</p>
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold uppercase">
                      {user?.role}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Joined</p>
                    <p className="font-medium text-gray-800">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Complete Profile Form */}
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Complete Your Profile (Step 1)</h2>
              
              {isSaved && (
                <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-2 rounded mb-4 text-sm">
                  Profile updated successfully!
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 max-w-xl">
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    About Me (Bio)
                  </label>
                  <textarea
                    id="bio"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a little about your academic interests..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    className="bg-blue-700 text-white px-4 py-2 rounded font-medium hover:bg-blue-800 transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentProfilePage;

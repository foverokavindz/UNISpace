// ============================================================
// src/pages/AdminProfilePage.tsx
// Admin Profile page — view and edit profile information
// ============================================================

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { updateProfile } from '../services/auth.service';

const AdminProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();

  // Edit mode toggle
  const [isEditing, setIsEditing] = useState(false);

  // Form state — pre-filled from current user
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobile_number || '');
  const [studentId, setStudentId] = useState(user?.student_id || '');

  // Feedback state
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCancel = () => {
    // Reset form to current user values
    setFullName(user?.full_name || '');
    setEmail(user?.email || '');
    setMobileNumber(user?.mobile_number || '');
    setStudentId(user?.student_id || '');
    setIsEditing(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await updateProfile({
        full_name: fullName,
        email,
        mobile_number: mobileNumber,
        student_id: studentId,
      });

      if (response.success && response.data) {
        // Update auth context with new user data
        setUser(response.data);
        // Also update localStorage
        localStorage.setItem('user', JSON.stringify(response.data));
        setSuccessMsg('Profile updated successfully!');
        setIsEditing(false);
      } else {
        setErrorMsg(response.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'An error occurred while updating your profile.'
      );
    } finally {
      setIsSaving(false);
      // Auto-hide success message after 4 seconds
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <Layout>
          <div className="max-w-4xl mx-auto">

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Admin Profile</h1>
              <p className="text-gray-500 mt-1">View and manage your admin account settings.</p>
            </div>

            {/* Success / Error alerts */}
            {successMsg && (
              <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded mb-6 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-6 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errorMsg}
              </div>
            )}

            {/* Profile Overview Card */}
            <div className="bg-white rounded shadow p-6 mb-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center text-4xl text-blue-600 font-bold border-4 border-white shadow-md">
                  {user?.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="mt-3 inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded text-xs font-semibold uppercase">
                  {user?.role}
                </span>
              </div>

              <div className="flex-1 w-full">
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Account Information</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-800 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </button>
                  )}
                </div>

                {!isEditing ? (
                  /* ---- View Mode ---- */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Full Name</p>
                      <p className="font-medium text-gray-800">{user?.full_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Student / Admin ID</p>
                      <p className="font-medium text-gray-800">{user?.student_id || 'Not set'}</p>
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
                ) : (
                  /* ---- Edit Mode ---- */
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="admin-fullname" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="admin-fullname"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="admin-studentid" className="block text-sm font-medium text-gray-700 mb-1">
                          Student / Admin ID
                        </label>
                        <input
                          id="admin-studentid"
                          type="text"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="admin-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="admin-mobile" className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile Number
                        </label>
                        <input
                          id="admin-mobile"
                          type="text"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Non-editable fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Role</p>
                        <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-semibold uppercase">
                          {user?.role} (cannot change)
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Joined</p>
                        <p className="text-sm font-medium text-gray-600">
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-blue-700 text-white px-5 py-2 rounded font-medium hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSaving && (
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="bg-gray-200 text-gray-700 px-5 py-2 rounded font-medium hover:bg-gray-300 transition disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Security</h2>
              <p className="text-gray-500 text-sm mb-3">
                To change your password, use the forgot password flow from the login page.
              </p>
              <div className="text-sm text-gray-600">
                <p><strong>Last login:</strong> Current session</p>
              </div>
            </div>

          </div>
        </Layout>
  );
};

export default AdminProfilePage;

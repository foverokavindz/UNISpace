// ============================================================
// src/components/Navbar.tsx
// Top navigation bar shown on all pages after login
// ============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between shadow">
      {/* Logo / App name */}
      <div className="text-xl font-bold tracking-wide">
        UNISpace
      </div>

      {/* User info + logout */}
      {user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm hidden sm:inline-block">
              {user.full_name} &nbsp;
              <span className="bg-blue-500 px-2 py-0.5 rounded text-xs uppercase text-white border border-blue-400">
                {user.role}
              </span>
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white text-blue-700 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50 transition ml-2"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

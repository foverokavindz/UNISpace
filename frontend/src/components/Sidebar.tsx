// ============================================================
// src/components/Sidebar.tsx
// Left sidebar with navigation links (role-aware)
// ============================================================

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  // Links for students
  const studentLinks = [
    { label: 'Dashboard',         path: '/student/dashboard' },
    { label: 'Profile',           path: '/student/profile' },
    { label: 'Resources',         path: '/student/resources' },
    { label: 'Notifications',     path: '/student/notifications' },
  ];

  // Links for admins
  const adminLinks = [
    { label: 'Dashboard',         path: '/admin/dashboard' },
    { label: 'Profile',           path: '/admin/profile' },
    { label: 'Upload Resource',   path: '/admin/upload-resources' },
    { label: 'Manage Resources',  path: '/admin/resources' },
  ];

  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  return (
    <aside className="w-56 bg-gray-800 text-gray-100 min-h-screen flex flex-col py-6 px-4">
      <p className="text-xs uppercase text-gray-400 mb-4 tracking-widest">Navigation</p>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `px-4 py-2 rounded text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

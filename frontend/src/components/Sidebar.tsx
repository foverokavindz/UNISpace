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
    { label: 'Quizzes',           path: '/student/quizzes' },
    { label: 'Study Sessions',    path: '/student/sessions' },
    { label: 'Notifications',     path: '/student/notifications' },
  ];

  // Links for admins
  const adminLinks = [
    { label: 'Dashboard',         path: '/admin/dashboard' },
    { label: 'Profile',           path: '/admin/profile' },
    { label: 'Upload Resource',   path: '/admin/upload-resources' },
    { label: 'Manage Resources',  path: '/admin/resources' },
    { label: 'Quizzes',           path: '/admin/quizzes' },
    { label: 'Study Sessions',    path: '/admin/sessions' },
  ];

  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  return (
    <aside className="w-56 shrink-0 bg-slate-900 text-slate-100 overflow-y-auto flex flex-col py-6 px-3">
      <p className="text-[11px] font-medium uppercase text-slate-500 mb-3 px-3 tracking-wider">
        Navigation
      </p>
      <nav className="flex flex-col gap-1.5">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `px-3 py-2.5 rounded-md text-sm transition ${
                isActive
                  ? 'bg-primary text-white font-medium'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
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

// ============================================================
// src/components/Navbar.tsx
// Top navigation bar shown on all pages after login
// ============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Badge, Button } from './ui';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="shrink-0 bg-surface border-b border-border px-6 py-3 flex items-center justify-between">
      {/* Logo / App name */}
      <div className="text-xl font-bold tracking-tight text-primary">
        UNISpace
      </div>

      {/* User info + logout */}
      {user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm font-medium text-[color:var(--color-text)]">
                {user.full_name}
              </span>
              <Badge className="uppercase">{user.role}</Badge>
            </div>
          </div>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

// ============================================================
// src/components/Layout.tsx
// App shell: pinned Navbar + Sidebar with a scrollable main area.
// Fixed-viewport layout (SaaS style) — only <main> scrolls, the
// navbar and sidebar stay in place.
// ============================================================

import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  /** Extra classes appended to <main> (e.g. "flex flex-col"). */
  mainClassName?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, mainClassName = '' }) => {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className={`flex-1 overflow-y-auto p-8 bg-gray-50 ${mainClassName}`.trim()}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

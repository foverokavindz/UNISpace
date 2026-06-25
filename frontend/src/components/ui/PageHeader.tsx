// ============================================================
// src/components/ui/PageHeader.tsx
// Page title + optional subtitle + optional right-side action slot
// ============================================================

import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="section-heading">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[color:var(--color-text-muted)] mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
};

export default PageHeader;

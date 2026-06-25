// ============================================================
// src/components/ui/Badge.tsx
// Status badge — pulls colors from the design tokens
// ============================================================

import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
};

const Badge: React.FC<BadgeProps> = ({ variant = 'default', className = '', children }) => {
  return <span className={`${base} ${variants[variant]} ${className}`.trim()}>{children}</span>;
};

export default Badge;

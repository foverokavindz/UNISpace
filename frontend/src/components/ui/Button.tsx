// ============================================================
// src/components/ui/Button.tsx
// Base button — pulls colors from the design tokens
// ============================================================

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-surface text-[color:var(--color-text)] border border-border hover:bg-slate-50',
  ghost: 'bg-transparent text-[color:var(--color-text-muted)] hover:bg-slate-100',
};

const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', children, ...rest }) => {
  return (
    <button className={`${base} ${variants[variant]} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
};

export default Button;

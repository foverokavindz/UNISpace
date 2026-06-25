// ============================================================
// src/components/ui/Card.tsx
// Surface wrapper using the .card utility class
// ============================================================

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ className = '', children, ...rest }) => {
  return (
    <div className={`card ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
};

export default Card;

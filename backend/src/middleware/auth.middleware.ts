// ============================================================
// src/middleware/auth.middleware.ts
// JWT verification middleware — protects private routes
// ============================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types';

// Extend Express Request to include our decoded user info
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ----------------------------------------------------------
// verifyToken
// Checks that a valid JWT is present in the Authorization header.
// Usage:  router.get('/protected', verifyToken, handler)
// ----------------------------------------------------------
export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];

  // Header must be: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;   // attach decoded payload to request
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ----------------------------------------------------------
// requireRole
// Role-based access control — use after verifyToken.
// Usage:  router.get('/admin', verifyToken, requireRole('admin'), handler)
// ----------------------------------------------------------
export const requireRole = (role: UserRole) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
      return;
    }
    next();
  };
};

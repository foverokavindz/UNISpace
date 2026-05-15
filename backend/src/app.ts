// ============================================================
// src/app.ts
// Express app setup — middleware, routes, error handling
// ============================================================

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app: Application = express();

// ----------------------------------------------------------
// Global middleware
// ----------------------------------------------------------

// Enable CORS so the React frontend (different port) can call us
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server default port
  credentials: true,
}));

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// ----------------------------------------------------------
// Routes
// ----------------------------------------------------------

// Health check endpoint — useful for testing that server is up
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'UNISpace API is running.' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// ----------------------------------------------------------
// 404 handler — for any undefined routes
// ----------------------------------------------------------
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

export default app;

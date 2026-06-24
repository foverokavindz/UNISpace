// ============================================================
// src/server.ts
// Entry point — starts the HTTP server
// ============================================================

import app from './app';
import { testConnection, getPool } from './config/database';

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  // Start the HTTP server first so /api/health always works
  app.listen(PORT, () => {
    console.log(`🚀 UNISpace API running at http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Then try to connect to the database
  try {
    await testConnection();
  } catch (error) {
    console.error('⚠️ Database connection failed — API routes that need DB will not work until DB is available.');
  }
};

startServer();


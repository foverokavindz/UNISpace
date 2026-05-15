// ============================================================
// src/server.ts
// Entry point — starts the HTTP server
// ============================================================

import app from './app';
import { testConnection } from './config/database';

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  // Test SQL Server connection before accepting requests
  await testConnection();

  app.listen(PORT, () => {
    console.log(`🚀 UNISpace API running at http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();
